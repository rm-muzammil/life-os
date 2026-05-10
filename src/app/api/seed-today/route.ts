// src/app/api/seed-today/route.ts
//
// Called automatically when the dashboard loads each morning.
// Checks if tasks already exist for today — if not, inserts the week's
// pre-planned tasks for today's focus tracks from weeklyRoadmap.ts.
// For weeks > 18 (not pre-defined), calls Claude to generate tasks.
// IDEMPOTENT — safe to call multiple times, never duplicates.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getDailyTasks, getWeekPlan } from '@/lib/weeklyRoadmap'
import { getCurrentWeek, DAY_FOCUS } from '@/types'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today      = new Date().toISOString().split('T')[0]
  const dayOfWeek  = new Date().getDay()
  const weekNum    = getCurrentWeek()
  const userId     = session.user.id

  // ── Idempotency check ─────────────────────────────────────────────────────
  // Check if we already seeded tasks today (look for agent-seeded tasks)
  const { data: existing } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('due_date', today)
    .eq('source', 'agent')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ seeded: false, reason: 'already_seeded', count: 0 })
  }

  // ── Check if user already has manual tasks today ───────────────────────────
  const { data: manualTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('user_id', userId)
    .eq('due_date', today)
    .limit(1)

  // Still seed even if manual tasks exist — they're complementary

  // ── Get tasks from static roadmap or generate with AI ────────────────────
  let tasksToInsert: { title: string; track: string; priority: string; hours: number; notes: string }[] = []

  const staticTasks = getDailyTasks(weekNum, dayOfWeek)

  if (staticTasks.length > 0) {
    // We have pre-planned tasks for this week
    tasksToInsert = staticTasks
  } else {
    // Week is beyond static roadmap — generate with Claude
    const plan = getWeekPlan(weekNum)
    const weekTheme = plan?.theme ?? 'Continue roadmap progression'
    const dayFocus  = DAY_FOCUS[dayOfWeek]

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are generating daily tasks for a student on a 2-year Germany tech roadmap.
Week: ${weekNum}/104
Phase: ${weekNum <= 8 ? 1 : weekNum <= 16 ? 2 : weekNum <= 30 ? 3 : weekNum <= 52 ? 4 : weekNum <= 78 ? 5 : 6}
Today's focus: ${dayFocus}
Week theme: ${weekTheme}

Return ONLY valid JSON, no markdown:
{"tasks":[{"title":"specific actionable task","track":"ML|Cloud|Backend|Data|Project|German|MERN","priority":"High|Medium|Low","hours":1.5,"notes":"resource or detail"}]}

Generate 3-4 tasks matching today's focus (${dayFocus}). Be very specific.`,
        }],
      })

      const text  = response.content.map(b => b.type === 'text' ? b.text : '').join('')
      const clean = text.replace(/```json|```/g, '').trim()
      const data  = JSON.parse(clean)
      tasksToInsert = data.tasks ?? []
    } catch {
      // Fallback: basic tasks if AI fails
      tasksToInsert = [
        { title: `Week ${weekNum} focus: continue current track deep work session`, track: 'ML', priority: 'High', hours: 1.5, notes: 'Check your Notion board for this week\'s goal' },
        { title: 'Review and add 20 Anki flashcards from this week\'s study', track: 'ML', priority: 'Medium', hours: 0.5, notes: '' },
        { title: 'German: 15-min Duolingo session + 1 iTalki vocab exercise', track: 'German', priority: 'Medium', hours: 0.25, notes: '' },
      ]
    }
  }

  // ── Insert tasks into Supabase ─────────────────────────────────────────────
  const rows = tasksToInsert.map(t => ({
    user_id:    userId,
    title:      t.title,
    track:      t.track,
    priority:   t.priority,
    hours:      t.hours,
    notes:      t.notes ?? '',
    status:     'todo',
    due_date:   today,
    source:     'agent',
  }))

  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ── Log to agent_logs ─────────────────────────────────────────────────────
  await supabase.from('agent_logs').insert({
    user_id:       userId,
    prompt:        `Auto-seed: Week ${weekNum}, ${DAY_FOCUS[dayOfWeek]}`,
    response:      `Seeded ${rows.length} tasks from ${staticTasks.length > 0 ? 'static roadmap' : 'AI generation'}`,
    tasks_created: rows.length,
    week_number:   weekNum,
  })

  return NextResponse.json({
    seeded:  true,
    count:   inserted?.length ?? rows.length,
    source:  staticTasks.length > 0 ? 'roadmap' : 'ai_generated',
    week:    weekNum,
    day:     DAY_FOCUS[dayOfWeek],
  })
}