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
Phase 1 (Wks 1-8): Sem4 active. Python, NumPy, Pandas, Docker basics, MERN freelancing, Project 1: GDPR RAG chatbot.
Phase 2 (Wks 9-16): Uni ends Jul 1. PyTorch, neural nets, AWS basics, FastAPI, Spring Boot, Kafka intro.
Phase 3 (Wks 17-30): Fine-tuning LoRA, Kubernetes, Terraform, MLflow, RAG advanced, AWS SAA cert, German B1.
Phase 4 (Wks 31-52): CKA, AWS PSA, CISM, Goethe B2, $18k freelance, Staff-level system design, job hunt.
Phase 5 (Wks 53-78): Job offers, Germany move, €80-100k, GCP ML cert, $30k total.
Phase 6 (Wks 79-104): Staff engineer, €150k+, C1 German, arXiv paper, $50k total.

TASK QUALITY RULES:
- Be extremely specific with concrete deliverables.
- track MUST be exactly one of: ML, Cloud, Backend, Data, Project, German, MERN.
- priority MUST be exactly one of: High, Medium, Low.
- Hours must be between 0.5 and 3.0.

OUTPUT: valid JSON only.`

const VALID_TRACKS = ['ML', 'Cloud', 'Backend', 'Data', 'Project', 'German', 'MERN']
const VALID_PRIORITIES = ['High', 'Medium', 'Low']

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { prompt, week, phase, dayFocus } = await req.json()

    // Using Gemini 3.1 Flash-Lite for 2026 Free Tier stability
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite', 
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    })

    const userContext = `Current week: ${week}/104 | Phase: ${phase} | Focus: ${dayFocus} | Request: ${prompt}`

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: userContext }
    ])

    const text = result.response.text()
    const data = JSON.parse(text)

    // Hard Sanitization to prevent "bg" undefined runtime errors in UI
    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks = data.tasks.map((t: any) => ({
        title: typeof t.title === 'string' ? t.title : 'Updated Roadmap Task',
        track: VALID_TRACKS.includes(t.track) ? t.track : 'ML',
        priority: VALID_PRIORITIES.includes(t.priority) ? t.priority : 'Medium',
        hours: typeof t.hours === 'number' ? t.hours : 1.5,
        notes: typeof t.notes === 'string' ? t.notes : '',
      }))
    }

    return NextResponse.json(data)

  } catch (err: any) {
    console.error('Agent Error:', err)
    // Return structured fallback so the frontend can still render something
    return NextResponse.json({
      message: "I'm recalibrating my systems. Here are your baseline targets for today.",
      tasks: [
        { title: "Review Phase 1 Python & Docker fundamentals", track: 'ML', priority: 'High', hours: 1.5, notes: 'Stay consistent with the roadmap.' },
        { title: "German vocab drill: 20 minutes", track: 'German', priority: 'Medium', hours: 0.5, notes: 'Focus on A2/B1 transitions.' }
      ]
    })
  }
}