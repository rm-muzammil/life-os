// src/app/api/report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { computeRoadmapReport } from '@/lib/roadmapReport'

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

  const report = computeRoadmapReport(tasks)

  return NextResponse.json(report)
}