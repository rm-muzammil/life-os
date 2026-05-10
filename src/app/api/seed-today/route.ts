// src/app/api/seed-today/route.ts
//
// Called once per day when the dashboard loads.
// Reads directly from your Excel roadmap (roadmapData.ts) — no AI cost.
// Fallback to Gemini only if week is somehow missing from Excel.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getDailyTasksFromRoadmap } from '@/lib/roadmapData'
import { getCurrentWeek, DAY_FOCUS } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today     = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const weekNum   = getCurrentWeek()
  const userId    = session.user.id

  // Idempotency: already seeded today?
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

  // Pull directly from Excel roadmap data
  let tasksToInsert = getDailyTasksFromRoadmap(weekNum, dayOfWeek)

  // Fallback if somehow no tasks (edge case)
  if (tasksToInsert.length === 0) {
    tasksToInsert = [
      { title: 'Review your roadmap and identify today\'s top priority', track: 'ML' as const, priority: 'High' as const, hours: 0.5, notes: '' },
      { title: 'Add 20 Anki cards from this week\'s material', track: 'ML' as const, priority: 'Medium' as const, hours: 0.5, notes: '' },
      { title: 'German: 15-min study session + 5 sentences', track: 'German' as const, priority: 'Medium' as const, hours: 0.25, notes: '' },
    ]
  }

  const rows = tasksToInsert.map(t => ({
    user_id:  userId,
    title:    t.title,
    track:    t.track,
    priority: t.priority,
    hours:    t.hours,
    notes:    t.notes ?? '',
    status:   'todo',
    due_date: today,
    source:   'agent',
  }))

  const { data: inserted, error } = await supabase
    .from('tasks')
    .insert(rows)
    .select('id')

  if (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('agent_logs').insert({
    user_id: userId,
    prompt: `Auto-seed: Week ${weekNum}, ${DAY_FOCUS[dayOfWeek]}`,
    response: `Seeded ${rows.length} tasks from Excel roadmap`,
    tasks_created: rows.length,
    week_number: weekNum,
  })

  return NextResponse.json({
    seeded: true,
    count:  inserted?.length ?? rows.length,
    source: 'excel_roadmap',
    week:   weekNum,
    day:    DAY_FOCUS[dayOfWeek],
  })
}
