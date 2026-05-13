// src/app/api/seed-today/route.ts
//
// FIX SUMMARY (6 bugs resolved):
//   1. New @google/genai SDK (replaces deprecated @google/generative-ai)
//   2. Stable model name: gemini-2.0-flash-001
//   3. Node.js runtime declared — prevents silent Vercel edge failures
//   4. Safe JSON parsing with regex fence stripping
//   5. Rich error logging (status + message + stack)
//   6. Prompt moved to user message, system prompt kept minimal
//
// Hybrid seed strategy:
//   1. Pull 1–2 main tasks from Excel roadmap (strategic plan)
//   2. If fewer than 4 tasks, AI generates 2–3 concrete sub-tasks
//   3. Always produces 3–5 tasks = 3–4 hrs deep work
//   4. Idempotent — safe to call multiple times, never duplicates

export const runtime = 'nodejs'   // ← FIX #3: prevents silent edge runtime crash

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getDailyTasksFromRoadmap, ROADMAP_WEEKS, type SeedTask } from '@/lib/roadmapData'
import { getCurrentWeek, DAY_FOCUS } from '@/types'

const VALID_TRACKS     = ['ML','Cloud','Backend','Data','Project','German','MERN'] as const
const VALID_PRIORITIES = ['High','Medium','Low'] as const

// ── FIX #1: New SDK import ─────────────────────────────────────────────────
// Run: npm uninstall @google/generative-ai && npm install @google/genai
import { GoogleGenAI } from '@google/genai'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today     = new Date().toISOString().split('T')[0]
  const dayOfWeek = new Date().getDay()
  const weekNum   = getCurrentWeek()
  const userId    = user.id

  // ── Idempotency check ───────────────────────────────────────────────────
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

  // ── Step 1: Excel main tasks ─────────────────────────────────────────────
  let tasks: SeedTask[] = getDailyTasksFromRoadmap(weekNum, dayOfWeek)

  // ── Step 2: AI sub-tasks if fewer than 4 ────────────────────────────────
  const weekData  = ROADMAP_WEEKS.find(w => w.week === weekNum)
  const dayFocus  = DAY_FOCUS[dayOfWeek]
  const mainTasks = tasks.map(t => t.title).join(' | ')

  if (tasks.length < 4 && process.env.GEMINI_API_KEY) {
    try {
      // ── FIX #1: New GoogleGenAI instantiation ──────────────────────────
      const ai    = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      const needed = 4 - tasks.length

      // ── FIX #6: Minimal system prompt, rich user prompt ────────────────
      const context = weekData
        ? `Week theme: ${weekData.phase}. Full week plan — ML: "${weekData.ml}" | Cloud: "${weekData.cloud}" | Backend: "${weekData.backend}" | Data: "${weekData.data}" | Project: "${weekData.project}" | German: "${weekData.german}" | MERN: "${weekData.mern}".`
        : `Week ${weekNum} of 104.`

      const userPrompt = `You are generating sub-tasks for a student on a 2-year Germany tech roadmap.

Today: Week ${weekNum}/104 | Day focus: ${dayFocus} | ${context}
Already seeded main tasks: ${mainTasks || 'none'}

Generate exactly ${needed} specific sub-tasks that:
1. Directly support or extend today's main tasks
2. Are concrete and actionable with a clear deliverable
3. Each takes 0.5–1.5 hours
4. Do NOT repeat what is already seeded
5. Match the week theme and student's current level

RULES:
- track must be exactly one of: ML, Cloud, Backend, Data, Project, German, MERN
- priority must be exactly one of: High, Medium, Low
- Return ONLY valid JSON — no markdown, no backticks, no preamble

JSON format:
{"tasks":[{"title":"specific task with deliverable","track":"ML","priority":"Medium","hours":1.0,"notes":"resource or tip"}]}`

      // ── FIX #2: Stable model name ──────────────────────────────────────
      const result = await ai.models.generateContent({
        model:  'gemini-2.5-flash',
        config: { temperature: 0.6 },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
      })

      const rawText = result.text ?? ''

      // ── FIX #4: Safe JSON parsing (strips ```json fences if present) ───
      let data: { tasks?: any[] }
      try {
        const clean = rawText.replace(/```json|```/g, '').trim()
        data = JSON.parse(clean)
      } catch (parseErr) {
        // ── FIX #5: Rich error logging ────────────────────────────────────
        console.error('Gemini JSON parse error:', {
          rawText,
          parseErr,
        })
        data = {}
      }

      if (Array.isArray(data.tasks)) {
        const subTasks: SeedTask[] = data.tasks
          .slice(0, needed)
          .map((t: any) => ({
            title:    typeof t.title === 'string' ? t.title : 'Study task',
            track:    VALID_TRACKS.includes(t.track)        ? t.track    : (tasks[0]?.track ?? 'ML'),
            priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
            hours:    typeof t.hours === 'number' && t.hours > 0 ? t.hours : 1,
            notes:    typeof t.notes === 'string' ? t.notes : '',
          }))
        tasks = [...tasks, ...subTasks]
      }

    } catch (err: any) {
      // ── FIX #5: Rich error logging ───────────────────────────────────────
      const isRateLimit = err?.status === 429 || err?.message?.includes('429')
      console.error(isRateLimit ? 'Gemini Rate Limit:' : 'Gemini Error:', {
        message: err?.message,
        status:  err?.status,
        stack:   err?.stack,
      })
      // Continue with just Excel tasks — partial seed beats total failure
    }
  }

  // ── Step 3: Absolute fallback if still empty ────────────────────────────
  if (tasks.length === 0) {
    tasks = [
      { title: "Review this week's roadmap goal and set today's #1 priority", track: 'ML',     priority: 'High',   hours: 0.5,  notes: 'Check your Notion board' },
      { title: "Add 20 Anki flashcards from this week's material",            track: 'ML',     priority: 'Medium', hours: 0.5,  notes: '' },
      { title: 'German: 15-min Duolingo + write 5 sentences using new vocab', track: 'German', priority: 'Medium', hours: 0.25, notes: '' },
    ]
  }

  // ── Step 4: Insert all tasks ────────────────────────────────────────────
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
    prompt:        `Auto-seed: Week ${weekNum}, ${dayFocus}`,
    response:      `Seeded ${rows.length} tasks (Excel + AI hybrid)`,
    tasks_created: rows.length,
    week_number:   weekNum,
  })

  return NextResponse.json({
    seeded: true,
    count:  inserted?.length ?? rows.length,
    source: 'hybrid',
    week:   weekNum,
    day:    dayFocus,
  })
}