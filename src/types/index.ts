// ── Auto-generated from Supabase schema ──────────────────────
// Run: npm run db:types  to regenerate after schema changes

export type TaskStatus   = 'todo' | 'inprogress' | 'done'
export type TaskTrack    = 'ML' | 'Cloud' | 'Backend' | 'Data' | 'Project' | 'German' | 'MERN'
export type TaskPriority = 'High' | 'Medium' | 'Low'
export type TaskSource   = 'manual' | 'agent'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  roadmap_start: string
  roadmap_end: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  track: TaskTrack
  priority: TaskPriority
  status: TaskStatus
  source: TaskSource
  hours: number
  due_date: string
  completed_at: string | null
  week_number: number
  created_at: string
  updated_at: string
}

export interface Streak {
  id: string
  user_id: string
  date: string
  level: 0 | 1 | 2 | 3 | 4
  tasks_done: number
  tasks_total: number
  hours_done: number
  created_at: string
  updated_at: string
}

export interface AgentLog {
  id: string
  user_id: string
  prompt: string
  response: string
  tasks_created: number
  week_number: number | null
  created_at: string
}

export interface Milestone {
  id: string
  user_id: string
  week_number: number
  title: string
  achieved: boolean
  achieved_at: string | null
  created_at: string
}

export interface UserStats {
  user_id: string
  total_done: number
  total_remaining: number
  total_hours: number
  active_days: number
  current_week: number
}

export interface TrackStats {
  user_id: string
  track: TaskTrack
  done_count: number
  pending_count: number
  hours_invested: number
}

// ── App-level types ───────────────────────────────────────────

export interface PhaseInfo {
  number: number
  name: string
  desc: string
  weekStart: number
  weekEnd: number
}

export interface AgentTask {
  title: string
  track: TaskTrack
  priority: TaskPriority
  hours: number
  notes: string
}

export interface AgentResponse {
  message: string
  tasks: AgentTask[]
}

export const PHASES: PhaseInfo[] = [
  { number: 1, name: 'Foundation',    desc: 'Sem4 + Arabic active. MERN gigs. Python + ML basics.',         weekStart: 1,   weekEnd: 8   },
  { number: 2, name: 'Core Build',    desc: 'Uni ends Jul 1. Full focus. ML + Cloud + first projects.',     weekStart: 9,   weekEnd: 16  },
  { number: 3, name: 'Specialise',    desc: 'Deep ML, advanced cloud, 3 projects live, German B1.',         weekStart: 17,  weekEnd: 30  },
  { number: 4, name: 'Senior Push',   desc: 'Staff-level skills, 5 projects, freelance/internship hunt.',   weekStart: 31,  weekEnd: 52  },
  { number: 5, name: 'Germany Entry', desc: 'Apply to German jobs. ML + Cloud certified.',                  weekStart: 53,  weekEnd: 78  },
  { number: 6, name: 'Top 0.1%',      desc: 'Staff engineer. €150k+. Germany secured.',                    weekStart: 79,  weekEnd: 104 },
]

export const TRACK_META: Record<TaskTrack, { color: string; bg: string; label: string }> = {
  ML:      { color: '#7c5cfc', bg: 'rgba(124,92,252,0.12)',  label: 'ML / AI' },
  Cloud:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Cloud + DevOps' },
  Backend: { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: 'Backend' },
  Data:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Data Eng' },
  Project: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   label: 'Projects' },
  German:  { color: '#ec4899', bg: 'rgba(236,72,153,0.12)',  label: 'German' },
  MERN:    { color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  label: 'MERN Finance' },
}

export const DAY_FOCUS = [
  'Plan + Rest',    // Sunday
  'ML / AI Learn',  // Monday
  'Build Projects', // Tuesday
  'Cloud + Backend',// Wednesday
  'Build Projects', // Thursday
  'German + Review',// Friday
  'Deep Sprint',    // Saturday
]

export const ROADMAP_START = new Date('2026-05-10')
export const TOTAL_WEEKS   = 104

export function getCurrentWeek(): number {
  const diff = Date.now() - ROADMAP_START.getTime()
  return Math.max(1, Math.ceil(diff / (7 * 24 * 3600 * 1000)))
}

export function getCurrentPhase(): PhaseInfo {
  const week = getCurrentWeek()
  return PHASES.find(p => week >= p.weekStart && week <= p.weekEnd) ?? PHASES[0]
}
