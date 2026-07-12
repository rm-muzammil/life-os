// src/app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateKnowledge } from '@/lib/knowledge'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const secret = process.env.PULL_SECRET
  const auth   = req.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()

  const { data: tasks, error } = await supabase.from('tasks').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })

  const todayTasks = tasks.filter((t: any) => t.due_date === today)
  const doneToday  = todayTasks.filter((t: any) => t.status === 'done').length
  const totalToday = todayTasks.length
  const todayCompletion = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100)

  // Overall completion across all tasks
  const totalTasks    = tasks.length
  const totalDone     = tasks.filter((t: any) => t.status === 'done').length
  const overallCompletion = totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100)

  const knowledge = calculateKnowledge(tasks)

  // Score — use today's completion if tasks exist, else use knowledge score
  const score = totalToday > 0
    ? todayCompletion
    : Math.min(100, Math.round(knowledge))

  // Streak — count consecutive days with at least one done task
  // Group done tasks by date, then count consecutive days back from today
  const doneDates = new Set(
    tasks
      .filter((t: any) => t.status === 'done' && t.updated_at)
      .map((t: any) => new Date(t.updated_at)
        .toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }))
  )

  let streak = 0
  const cursor = new Date(today + 'T00:00:00+05:00')
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
    if (doneDates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  return NextResponse.json({
    score,
    label:     'Roadmap',
    streak,
    todayDone: todayCompletion === 100,
    updatedAt: new Date().toISOString(),
    details: {
      completion:      todayCompletion,
      overallCompletion,
      todayTotal:      totalToday,
      todayDone:       doneToday,
      totalTasksDone:  totalDone,
      knowledge,
    },
  })
}