-- ============================================================
-- RoadmapOS — Full Database Schema
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
-- Extended user data, auto-created on signup
create table public.profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text unique not null,
  full_name    text,
  avatar_url   text,
  roadmap_start date not null default '2026-05-10',
  roadmap_end   date not null default '2028-05-10',
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── TASKS ───────────────────────────────────────────────────
create type task_status as enum ('todo', 'inprogress', 'done');
create type task_track  as enum ('ML', 'Cloud', 'Backend', 'Data', 'Project', 'German', 'MERN');
create type task_priority as enum ('High', 'Medium', 'Low');
create type task_source as enum ('manual', 'agent');

create table public.tasks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  notes       text,
  track       task_track not null,
  priority    task_priority not null default 'Medium',
  status      task_status not null default 'todo',
  source      task_source not null default 'manual',
  hours       numeric(4,2) not null default 1.5,
  due_date    date not null default current_date,
  completed_at timestamptz,
  week_number  int generated always as (
    ceil(extract(epoch from (due_date - '2026-05-10'::date)) / 604800)::int
  ) stored,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.tasks enable row level security;

create policy "Users manage own tasks"
  on public.tasks for all using (auth.uid() = user_id);

-- Index for fast date queries
create index tasks_user_date on public.tasks(user_id, due_date);
create index tasks_user_status on public.tasks(user_id, status);
create index tasks_user_track on public.tasks(user_id, track);

-- ── STREAK DATA ─────────────────────────────────────────────
-- One row per day per user — completion level 0-4
create table public.streaks (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  date        date not null,
  level       int not null default 0 check (level between 0 and 4),
  tasks_done  int not null default 0,
  tasks_total int not null default 0,
  hours_done  numeric(5,2) not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, date)
);

alter table public.streaks enable row level security;

create policy "Users manage own streaks"
  on public.streaks for all using (auth.uid() = user_id);

create index streaks_user_date on public.streaks(user_id, date desc);

-- ── AGENT CONVERSATIONS ─────────────────────────────────────
-- Store AI agent history for context
create table public.agent_logs (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  prompt      text not null,
  response    text not null,
  tasks_created int not null default 0,
  week_number  int,
  created_at  timestamptz default now()
);

alter table public.agent_logs enable row level security;

create policy "Users view own agent logs"
  on public.agent_logs for all using (auth.uid() = user_id);

-- ── MILESTONES ──────────────────────────────────────────────
create table public.milestones (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  week_number  int not null,
  title       text not null,
  achieved    boolean not null default false,
  achieved_at timestamptz,
  created_at  timestamptz default now()
);

alter table public.milestones enable row level security;

create policy "Users manage own milestones"
  on public.milestones for all using (auth.uid() = user_id);

-- ── ANALYTICS VIEWS ─────────────────────────────────────────
-- Pre-aggregated stats for fast dashboard load
create or replace view public.user_stats as
select
  p.id as user_id,
  count(t.id) filter (where t.status = 'done')   as total_done,
  count(t.id) filter (where t.status != 'done')  as total_remaining,
  coalesce(sum(t.hours) filter (where t.status = 'done'), 0) as total_hours,
  count(distinct t.due_date) filter (where t.status = 'done') as active_days,
  ceil(extract(epoch from (current_date - p.roadmap_start)) / 604800)::int as current_week
from public.profiles p
left join public.tasks t on t.user_id = p.id
group by p.id, p.roadmap_start;

-- Track breakdown view
create or replace view public.track_stats as
select
  user_id,
  track,
  count(*) filter (where status = 'done')   as done_count,
  count(*) filter (where status != 'done')  as pending_count,
  coalesce(sum(hours) filter (where status = 'done'), 0) as hours_invested
from public.tasks
group by user_id, track;

-- ── UPDATED_AT TRIGGER ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.set_updated_at();

create trigger set_streaks_updated_at
  before update on public.streaks
  for each row execute procedure public.set_updated_at();

-- ── SEED DEFAULT MILESTONES ─────────────────────────────────
-- These get inserted per-user on signup via edge function (see below)
-- Example seeds shown for reference:
-- insert into milestones(user_id, week_number, title) values
--   (uid, 8,  'Project 1: GDPR RAG Chatbot live'),
--   (uid, 27, 'AWS Solutions Architect Associate'),
--   (uid, 34, 'CKA + Goethe B1'),
--   (uid, 45, 'AWS Professional Solutions Architect'),
--   (uid, 51, 'CISM + Goethe B2'),
--   (uid, 66, 'Arrive in Germany'),
--   (uid, 104,'TOP 0.1% — Goal Achieved');
