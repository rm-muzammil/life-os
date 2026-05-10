-- supabase/migrations/002_push_subscriptions.sql
-- Run in Supabase SQL Editor after 001_initial_schema.sql

-- ── Push subscriptions ───────────────────────────────────────────────────────
-- Stores browser push subscription objects per user + device.
-- One user can have multiple devices (phone + laptop).

create table public.push_subscriptions (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  endpoint      text not null,
  p256dh        text not null,   -- client public key
  auth          text not null,   -- auth secret
  user_agent    text,            -- browser/device info for debugging
  notify_hour   int  not null default 7,   -- hour to send morning notification (24h, user's local time)
  timezone      text not null default 'UTC',
  active        boolean not null default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, endpoint)      -- one row per device
);

alter table public.push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on public.push_subscriptions for all using (auth.uid() = user_id);

create index push_subs_user on public.push_subscriptions(user_id);
create index push_subs_active on public.push_subscriptions(active) where active = true;

-- ── Notification log ─────────────────────────────────────────────────────────
-- Track sent notifications — avoid duplicate sends, debug failures.

create table public.notification_log (
  id            uuid default uuid_generate_v4() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  type          text not null default 'daily_tasks',   -- daily_tasks | milestone | streak_reminder
  payload       jsonb,
  sent_at       timestamptz default now(),
  success       boolean not null default true,
  error_message text
);

alter table public.notification_log enable row level security;

create policy "Users view own notification log"
  on public.notification_log for select using (auth.uid() = user_id);

-- Only server (service_role) can insert — users can't fake log entries
-- No insert policy needed for user role — API routes use service_role key

create index notif_log_user_date on public.notification_log(user_id, sent_at desc);

-- ── Updated_at trigger ───────────────────────────────────────────────────────
create trigger set_push_subs_updated_at
  before update on public.push_subscriptions
  for each row execute procedure public.set_updated_at();
