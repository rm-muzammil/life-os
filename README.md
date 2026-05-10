# RoadmapOS — Setup Guide

Your personal OS for the 2-year Germany tech roadmap.
Stack: **Next.js 14 · Supabase · Claude AI · Tailwind · Framer Motion**

---

## Project Structure

```
roadmap-os/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Root layout (fonts, toaster)
│   │   ├── globals.css         ← Design tokens + animations
│   │   ├── page.tsx            ← Redirects / → /dashboard
│   │   ├── auth/page.tsx       ← Login / Signup
│   │   ├── dashboard/          ← Today's command center
│   │   │   ├── layout.tsx      ← Sidebar nav (shared by all pages)
│   │   │   └── page.tsx
│   │   ├── board/page.tsx      ← Full kanban with filters
│   │   ├── streak/page.tsx     ← GitHub-style activity grid
│   │   ├── analytics/page.tsx  ← Charts + milestone tracker
│   │   ├── agent/page.tsx      ← AI chat interface
│   │   └── api/
│   │       ├── agent/route.ts  ← Claude API call (server-side)
│   │       └── tasks/route.ts  ← CRUD REST API for tasks
│   ├── components/
│   │   └── tasks/
│   │       └── AddTaskModal.tsx
│   ├── lib/
│   │   └── supabase.ts         ← Browser + server Supabase clients
│   ├── types/index.ts          ← All TypeScript types + constants
│   └── middleware.ts           ← Auth redirect middleware
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  ← Full DB schema
├── .env.local.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Step 1 — Create Supabase project (5 min)

1. Go to **https://supabase.com** → New project
2. Name it `roadmap-os`, choose a strong DB password, pick the nearest region (Frankfurt for Germany vibes)
3. Wait ~2 min for it to spin up
4. Go to **Settings → API** → copy:
   - `Project URL`  → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public`  → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Run the database schema (2 min)

1. In Supabase → **SQL Editor** → New query
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** — you'll see tables created: `profiles`, `tasks`, `streaks`, `agent_logs`, `milestones`
4. Verify in **Table Editor** that all tables exist

---

## Step 3 — Get Anthropic API key (2 min)

1. Go to **https://console.anthropic.com**
2. API Keys → Create Key → copy it
3. Add to `.env.local` as `ANTHROPIC_API_KEY`

---

## Step 4 — Local setup (3 min)

```bash
# Clone / navigate to project
cd roadmap-os

# Install all dependencies
npm install

# Copy env template
cp .env.local.example .env.local

# Fill in your keys in .env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# ANTHROPIC_API_KEY=sk-ant-...

# Start dev server
npm run dev
```

Open **http://localhost:3000** → redirects to `/auth` → sign up → you're in.

---

## Step 5 — Deploy to Vercel (5 min)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
vercel

# Follow prompts, then add env vars in Vercel dashboard:
# Settings → Environment Variables → add all 3 from .env.local
```

Or: push to GitHub → connect repo on **https://vercel.com** → add env vars → auto-deploy.

Your app is live at `https://roadmap-os-xxx.vercel.app`.

---

## How the app works

### Auth flow
- Middleware (`src/middleware.ts`) checks session on every request
- Unauthenticated → redirect to `/auth`
- Authenticated + visiting `/auth` → redirect to `/dashboard`
- Signup auto-creates a `profiles` row via Supabase trigger

### Data flow
```
User action → Supabase client (browser) → PostgreSQL (Supabase)
                                        ↕
                              Row Level Security
                         (users only see own data)
```

### AI Agent flow
```
User types prompt
  → POST /api/agent (Next.js server route)
    → Verify Supabase session
    → Call Claude claude-sonnet-4-20250514 with roadmap context
    → Parse JSON response (message + tasks[])
    → Return to client
  → User clicks "Add to board"
    → Insert tasks into Supabase tasks table
    → Log to agent_logs table
```

### Streak system
- Every time a task is completed, streak level for today is recalculated
- Level 0 = no activity, 1 = started, 2 = 50%+, 3 = 75%+, 4 = all done
- Streak page shows 365-day grid (like GitHub contributions)

---

## Extending the app

### Add push notifications (Wk 10+ skill)
```typescript
// Use Supabase Edge Functions + Web Push API
// Trigger: daily reminder at 6:30 AM if no tasks started
```

### Add weekly email report (Wk 15+ skill)
```typescript
// Supabase Edge Function (cron) → Resend API
// Every Sunday: streak, tasks done, next week plan
```

### Add mobile app (Wk 20+ skill)
```typescript
// Expo + React Native — same Supabase backend
// Streak widget on home screen
```

### Add German word-of-the-day (Wk 8+)
```typescript
// /api/german-word → Claude generates vocab from B1 list
// Shows in dashboard header every day
```

---

## Tech you learn building this

| Feature | Tech | Roadmap connection |
|---|---|---|
| Auth + DB | Supabase (PostgreSQL) | Data Engineering track |
| Server routes | Next.js App Router | Backend track |
| AI integration | Anthropic SDK | ML track |
| Deployment | Vercel | Cloud track |
| Animations | Framer Motion | Frontend skill |
| Charts | Recharts | Data visualisation |
| RLS policies | PostgreSQL | Security / GDPR mindset |

This project alone covers skills from 5 of your 7 tracks. It's Portfolio Project 0.

---

## Troubleshooting

**"Unauthorized" from /api/agent**
→ Check ANTHROPIC_API_KEY in .env.local, restart dev server

**Tasks not saving**
→ Check Supabase RLS policies are set (run migration again)
→ Check NEXT_PUBLIC_SUPABASE_URL has no trailing slash

**Auth redirect loop**
→ Clear browser cookies → hard refresh

**Types error on `user_stats` view**
→ Run `npm run db:types` to regenerate types from your Supabase schema
