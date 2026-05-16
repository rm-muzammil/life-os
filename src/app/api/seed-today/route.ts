// src/app/api/seed-today/route.ts
//
// FIXES APPLIED:
//   1. New @google/genai SDK (replaces deprecated @google/generative-ai)
//   2. Stable model: gemini-2.5-flash
//   3. Node.js runtime declared — prevents silent Vercel edge failures
//   4. Safe JSON parsing with regex fence stripping
//   5. Rich error logging (status + message)
//   6. Week-aware deduplication — same Excel task never repeats across days
//   7. Gemini told what was already covered this week — no repeated sub-tasks

export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getDailyTasksFromRoadmap, ROADMAP_WEEKS, type SeedTask } from '@/lib/roadmapData'
import { getCurrentWeek, DAY_FOCUS } from '@/types'
import { GoogleGenAI } from '@google/genai'

const VALID_TRACKS     = ['ML','Cloud','Backend','Data','Project','German','MERN'] as const
const VALID_PRIORITIES = ['High','Medium','Low'] as const

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today     = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const weekNum   = getCurrentWeek()
  const userId    = user.id

  // ── Idempotency: already seeded today? ──────────────────────────────────
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

  // ── Get all tasks seeded THIS WEEK (to avoid repeats) ───────────────────
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Sunday
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('title, track')
    .eq('user_id', userId)
    .eq('source', 'agent')
    .gte('due_date', weekStartStr)
    .lt('due_date', today)

  const titlesThisWeek = (weekTasks ?? []).map(t => t.title)
  const tracksThisWeek = [...new Set((weekTasks ?? []).map(t => t.track))]

  // ── Step 1: Excel main tasks for today ──────────────────────────────────
  let rawTasks = getDailyTasksFromRoadmap(weekNum, dayOfWeek)

  // Remove any Excel task already seeded earlier this week
  let tasks: SeedTask[] = rawTasks.filter(t =>
    !titlesThisWeek.some(existing =>
      existing.toLowerCase().includes(t.title.toLowerCase().slice(0, 30)) ||
      t.title.toLowerCase().includes(existing.toLowerCase().slice(0, 30))
    )
  )

  // If today's tracks were all already done, pick next uncovered track
  if (tasks.length === 0 && rawTasks.length > 0) {
    const weekData = ROADMAP_WEEKS.find(w => w.week === weekNum)
    if (weekData) {
      const allKeys = ['ml','cloud','backend','data','project','german','mern'] as const
      const trackMap: Record<string, SeedTask['track']> = {
        ml:'ML', cloud:'Cloud', backend:'Backend', data:'Data',
        project:'Project', german:'German', mern:'MERN',
      }
      for (const key of allKeys) {
        const val = weekData[key] as string
        if (!val || val.startsWith('—') || val.startsWith('-')) continue
        const track = trackMap[key]
        if (tracksThisWeek.includes(track)) continue
        tasks.push({ title: val, track, priority: 'Medium', hours: 1, notes: weekData.phase })
        break
      }
    }
  }

  // Absolute fallback — week fully covered
  if (tasks.length === 0) {
    tasks = [{
      title:    'Review and consolidate this week — update Obsidian notes and Anki cards',
      track:    'ML',
      priority: 'Low',
      hours:    1,
      notes:    'All tracks covered this week. Review, reinforce, rest.',
    }]
  }

  // ── Step 2: Gemini sub-tasks to fill up to 4 total ──────────────────────
  const weekData = ROADMAP_WEEKS.find(w => w.week === weekNum)
  const dayFocus = DAY_FOCUS[dayOfWeek]

  if (tasks.length < 4 && process.env.GEMINI_API_KEY) {
    try {
      const ai      = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const needed  = 4 - tasks.length
      const todayMain    = tasks.map(t => t.title).join(' | ')
      const weekCovered  = titlesThisWeek.length > 0
        ? `Already covered this week — DO NOT repeat these topics: ${titlesThisWeek.slice(0, 8).join(' | ')}`
        : 'Nothing covered yet this week.'

      const context = weekData
        ? `Week ${weekNum} theme: ${weekData.phase}. Full week plan — ML: "${weekData.ml}" | Cloud: "${weekData.cloud}" | Backend: "${weekData.backend}" | Data: "${weekData.data}" | Project: "${weekData.project}" | German: "${weekData.german}" | MERN: "${weekData.mern}".`
        : `Week ${weekNum}/104.`

      const userPrompt = `You generate daily sub-tasks for a student on a 2-year Germany tech roadmap (goal: ML/Cloud engineer, €150k by 2028).

${context}
Today (Day ${dayOfWeek}, ${dayFocus}): ${todayMain}
${weekCovered}

Generate exactly ${needed} sub-tasks that:
1. Break down TODAY's main task into specific actionable steps with clear deliverables
2. Each takes 0.5–1.5 hours
3. Are completely DIFFERENT from what was covered earlier this week
4. Match Week ${weekNum} skill level (${weekData?.phase ?? 'foundation'})
5. Are specific — include commands, file names, or exact outcomes

RULES:
- track must be exactly one of: ML, Cloud, Backend, Data, Project, German, MERN
- priority must be exactly one of: High, Medium, Low
- Return ONLY valid JSON — no markdown, no backticks, no preamble

{"tasks":[{"title":"specific task with deliverable","track":"Cloud","priority":"High","hours":1.0,"notes":"specific tip or command"}]}`

      const result = await ai.models.generateContent({
        model:    'gemini-2.5-flash',
        config:   { temperature: 0.6 },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      })

      const rawText = result.text ?? ''

      // Safe JSON parse — strip markdown fences if present
      let data: { tasks?: any[] } = {}
      try {
        const clean = rawText.replace(/```json|```/g, '').trim()
        data = JSON.parse(clean)
      } catch (parseErr) {
        console.error('Gemini JSON parse error:', { rawText, parseErr })
      }

      if (Array.isArray(data.tasks)) {
        const subTasks: SeedTask[] = data.tasks
          .slice(0, needed)
          .map((t: any) => ({
            title:    typeof t.title    === 'string'  ? t.title    : 'Study task',
            track:    VALID_TRACKS.includes(t.track)  ? t.track    : (tasks[0]?.track ?? 'ML'),
            priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
            hours:    typeof t.hours === 'number' && t.hours > 0 ? t.hours : 1,
            notes:    typeof t.notes === 'string' ? t.notes : '',
          }))
        tasks = [...tasks, ...subTasks]
      }

    } catch (err: any) {
      const isRateLimit = err?.status === 429 || err?.message?.includes('429')
      console.error(isRateLimit ? 'Gemini Rate Limit:' : 'Gemini Error:', {
        message: err?.message,
        status:  err?.status,
        stack:   err?.stack,
      })
      // Continue with Excel tasks only — partial seed beats total failure
    }
  }

  // ── Step 3: Insert ───────────────────────────────────────────────────────
  const rows = tasks.map(t => ({
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
    console.error('Seed insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabase.from('agent_logs').insert({
    user_id:       userId,
    prompt:        `Auto-seed: Week ${weekNum}, Day ${dayOfWeek} (${dayFocus})`,
    response:      `Seeded ${rows.length} tasks. Week titles seen: ${titlesThisWeek.length}`,
    tasks_created: rows.length,
    week_number:   weekNum,
  })

  return NextResponse.json({
    seeded:        true,
    count:         inserted?.length ?? rows.length,
    source:        'hybrid',
    week:          weekNum,
    day:           dayFocus,
    weekTasksSeen: titlesThisWeek.length,
  })
}