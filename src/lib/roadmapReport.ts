// src/lib/roadmapReport.ts
import { calculateKnowledge } from './knowledge'

export function computeRoadmapReport(tasks: any[]) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
  const todayTasks = tasks.filter((t: any) => t.due_date === today)
  const doneToday = todayTasks.filter((t: any) => t.status === 'done').length
  const totalToday = todayTasks.length
  const todayCompletion = totalToday === 0 ? 0 : Math.round((doneToday / totalToday) * 100)

  const totalTasks = tasks.length
  const totalDone = tasks.filter((t: any) => t.status === 'done').length
  const overallCompletion = totalTasks === 0 ? 0 : Math.round((totalDone / totalTasks) * 100)

  const knowledge = calculateKnowledge(tasks)
  const score = totalToday > 0 ? todayCompletion : Math.min(100, Math.round(knowledge))

  const doneDates = new Set(
    tasks
      .filter((t: any) => t.status === 'done' && t.updated_at)
      .map((t: any) => new Date(t.updated_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }))
  )

  let streak = 0
  const cursor = new Date(today + 'T00:00:00+05:00')
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' })
    if (doneDates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else break
  }

  return {
    score,
    label: 'Roadmap',
    streak,
    todayDone: todayCompletion === 100,
    updatedAt: new Date().toISOString(),
    details: { completion: todayCompletion, overallCompletion, todayTotal: totalToday, todayDone: doneToday, totalTasksDone: totalDone, knowledge },
  }
}