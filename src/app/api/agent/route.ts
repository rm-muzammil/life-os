// src/app/api/agent/route.ts

export const runtime = 'nodejs'  // ← FIX #1: prevents silent Vercel edge crash

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'  // ← FIX #2: new SDK
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ← FIX #3: instantiate inside handler, not at module level
// (module-level instantiation can fail at build time if env var isn't set yet)

// ── FIX #4: System prompt is now SEPARATE from user prompt ────────────────
// Keeps it minimal so token usage stays low and responses are more reliable
const SYSTEM_PROMPT = `You are RoadmapOS AI Agent — a precision task generator for a student building toward a top German tech job by 2028.

OUTPUT RULES (non-negotiable):
- Return ONLY a valid JSON object — no markdown, no backticks, no text outside JSON
- track must be exactly one of: ML, Cloud, Backend, Data, Project, German, MERN
- priority must be exactly one of: High, Medium, Low
- Every task title must include a concrete deliverable

JSON format:
{
  "message": "2-3 sentences explaining what you created and why",
  "tasks": [
    {
      "title": "Specific task with concrete deliverable",
      "track": "ML",
      "priority": "High",
      "hours": 1.5,
      "notes": "max 10 words"
    }
  ]
}`

const VALID_TRACKS     = ['ML', 'Cloud', 'Backend', 'Data', 'Project', 'German', 'MERN'] as const
const VALID_PRIORITIES = ['High', 'Medium', 'Low'] as const

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, week, phase, dayFocus } = await req.json()

    // ← FIX #3: instantiate here, not at module level
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

    // ← FIX #4: rich roadmap context lives in the user message, not system prompt
    const userMessage = `Current week: ${week}/104 | Phase: ${phase} | Today's focus: ${dayFocus}
Request: ${prompt}

ROADMAP CONTEXT:
- Goal: Top 0.1% German ML/Cloud Engineer by 2028, €150k+, Goethe B2/C1
- Tracks: ML, Cloud, Backend, Data, Project, German, MERN
- Phase 0 (Wks 1-8):   Uni active. Python, NumPy, Pandas, Docker basics, MERN freelancing, Project 1: GDPR RAG chatbot
- Phase 1 (Wks 9-16):  Uni ends Jul 1. PyTorch, neural nets, AWS basics, FastAPI, Spring Boot, Kafka intro
- Phase 2 (Wks 17-30): Fine-tuning LoRA, Kubernetes, Terraform, MLflow, RAG advanced, AWS SAA cert, German B1
- Phase 3 (Wks 31-52): CKA, AWS PSA, CISM, Goethe B2, €18k freelance, staff-level system design, job hunt
- Phase 4 (Wks 53-78): Job offers, Germany move, €80-100k, GCP ML cert
- Phase 5 (Wks 79-104):Staff engineer, €150k+, C1 German, arXiv paper

TASK RULES:
- Be extremely specific: "Complete fast.ai Lesson 1, run notebook, write 5 Anki cards" NOT "learn ML"
- Hours: 0.5h = one sitting, 1.5h = deep work block, 3h = extended session
- For Projects: reference one of the 6 portfolio projects by name
- For MERN: tie to a concrete income action (proposal, gig, client email)
- For German: match level to phase (A2→B1 in Phase 0-1, B1→B2 in Phase 2-3, B2→C1 in Phase 4-5)

Generate 3-5 tasks for today.`

    // ← FIX #2: new SDK call syntax; FIX #5: pinned stable model name
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature:     0.7,
        maxOutputTokens: 2048,
        responseMimeType:  'application/json'
      },
      contents: [
        { role: 'user', parts: [{ text: userMessage }] },
      ],
    })

    const rawText = result.text ?? ''

    // ← FIX #6: safe JSON parsing — strips ```json fences if Gemini adds them
    let data: { message?: string; tasks?: any[] }
    try {
      // const clean = rawText.replace(/```json|```/g, '').trim()
      data = JSON.parse(rawText)
    } catch (parseErr) {
      // ← FIX #7: rich error logging
      console.error('Gemini JSON parse error:', { rawText, parseErr })
      throw new Error('Invalid JSON from Gemini')
    }

    // Sanitise every field — AI can hallucinate track/priority values
    if (Array.isArray(data.tasks)) {
      data.tasks = data.tasks.map((t: any) => ({
        ...t,
        title:    typeof t.title === 'string' && t.title.length > 0 ? t.title : 'Review roadmap task',
        track:    VALID_TRACKS.includes(t.track)        ? t.track    : 'ML',
        priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
        hours:    typeof t.hours === 'number' && t.hours > 0 ? t.hours : 1.5,
        notes:    typeof t.notes === 'string' ? t.notes : '',
      }))
    }

    return NextResponse.json(data)

  } catch (err: any) {
    // ← FIX #7: rich error logging (status + message + stack)
    console.error('Gemini Agent Error:', {
      message: err?.message,
      status:  err?.status,
      stack:   err?.stack,
    })

    return NextResponse.json({
      message: 'Gemini is temporarily unavailable. Here are default tasks to keep you on track.',
      tasks: [
        { title: "Open your Notion roadmap board and identify today's #1 priority task", track: 'ML',     priority: 'High',   hours: 0.5,  notes: 'Never start the day without a clear target.' },
        { title: "Add 20 Anki flashcards from this week's study material",               track: 'ML',     priority: 'Medium', hours: 0.5,  notes: '' },
        { title: "German: 15-min Duolingo + write 5 sentences using this week's vocab",  track: 'German', priority: 'Medium', hours: 0.25, notes: '' },
      ],
    })
  }
}