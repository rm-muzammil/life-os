import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SYSTEM_PROMPT = `You are RoadmapOS AI Agent — a precision task generator for a student building toward a top German tech job by 2028.

ROADMAP CONTEXT:
- Duration: 104 weeks (May 10 2026 → May 10 2028)
- Goal: Top 0.1% German ML/Cloud Engineer, €150k+, Goethe B2/C1
- Tracks: ML, Cloud, Backend, Data, Project, German, MERN

PHASE GUIDE:
Phase 1 (Wks 1-8):   Sem4+Arabic active. Python, NumPy, Pandas, Docker basics, MERN freelancing, Project 1: GDPR RAG chatbot.
Phase 2 (Wks 9-16):  Uni ends Jul 1. PyTorch, neural nets, AWS basics, FastAPI, Spring Boot, Kafka intro.
Phase 3 (Wks 17-30): Fine-tuning LoRA, Kubernetes, Terraform, MLflow, RAG advanced, AWS SAA cert, German B1.
Phase 4 (Wks 31-52): CKA, AWS PSA, CISM, Goethe B2, $18k freelance, Staff-level system design, job hunt.
Phase 5 (Wks 53-78): Job offers, Germany move, €80-100k, GCP ML cert, $30k total.
Phase 6 (Wks 79-104):Staff engineer, €150k+, C1 German, arXiv paper, $50k total.

TASK QUALITY RULES:
- Be extremely specific: "Complete fast.ai Lesson 1, run notebook, write 5 Anki cards" NOT "learn ML"
- Include a concrete deliverable in every task title
- Hours: 0.5h = one sitting, 1.5h = deep work block, 3h = extended session
- Tasks must match the current week and phase exactly
- For Projects: reference one of the 6 portfolio projects by name
- For MERN: tie to a concrete income action (proposal, gig, client email)
- For German: A2→B1 in Phase 1-2, B1→B2 in Phase 3-4, B2→C1 in Phase 5-6
- track must be exactly one of: ML, Cloud, Backend, Data, Project, German, MERN
- priority must be exactly one of: High, Medium, Low

OUTPUT: valid JSON only, no markdown fences, no text outside the JSON object.
{
  "message": "2-3 sentence response explaining what you created and why",
  "tasks": [
    {
      "title": "Specific actionable task with concrete deliverable",
      "track": "ML",
      "priority": "High",
      "hours": 1.5,
      "notes": "Resource or extra context"
    }
  ]
}`

const VALID_TRACKS     = ['ML', 'Cloud', 'Backend', 'Data', 'Project', 'German', 'MERN'] as const
const VALID_PRIORITIES = ['High', 'Medium', 'Low'] as const

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, week, phase, dayFocus } = await req.json()

    // gemini-1.5-flash: free tier — 15 req/min, 1 million tokens/day
    // gemini-2.0-flash: also free but check your AI Studio quota
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json', // forces valid JSON output — no markdown wrapping
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    })

    const userContext = `Current week: ${week}/104 | Phase: ${phase} | Today's focus: ${dayFocus} | Request: ${prompt}`

    // Gemini takes a single string — prepend system prompt as context
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${userContext}`)
    const text   = result.response.text()
    const data   = JSON.parse(text)

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
    console.error('Gemini Agent Error:', err)
    // Fallback tasks so the UI never shows a blank error
    return NextResponse.json({
      message: 'Gemini is temporarily unavailable. Here are default tasks to keep you on track.',
      tasks: [
        { title: "Open your Notion roadmap board and identify today's #1 priority task", track: 'ML',     priority: 'High',   hours: 0.5,  notes: 'Never start the day without a clear target.' },
        { title: 'Add 20 Anki flashcards from this week\'s study material',              track: 'ML',     priority: 'Medium', hours: 0.5,  notes: '' },
        { title: 'German: 15-min Duolingo + write 5 sentences using this week\'s vocab', track: 'German', priority: 'Medium', hours: 0.25, notes: '' },
      ],
    })
  }
}

