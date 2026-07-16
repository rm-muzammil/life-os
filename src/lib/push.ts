import { createClient } from '@supabase/supabase-js'
import { computeRoadmapReport } from './roadmapReport'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function pushToSelfKhilafah(): Promise<void> {
  const skUrl = process.env.SK_URL
  const apiKey = process.env.SK_API_KEY
  if (!skUrl || !apiKey) return

  try {
    const supabase = getServiceClient()
    const { data: tasks, error } = await supabase.from('tasks').select('*')
    if (error || !tasks) return

    const report = computeRoadmapReport(tasks)

    await fetch(`${skUrl.replace(/\/$/, '')}/api/provinces/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(report),
    })
  } catch {
    // Self-Khilafah also pulls daily as a fallback
  }
}