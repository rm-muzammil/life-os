import { createClient } from '@supabase/supabase-js'
import { computeRoadmapReport } from './roadmapReport'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}
export async function pushToSelfKhilafah(): Promise<void> {
  const skUrl = process.env.SK_URL
  const apiKey = process.env.SK_API_KEY
  if (!skUrl || !apiKey) {
    console.error('[push] Missing SK_URL or SK_API_KEY')
    return
  }

  try {
    const supabase = getServiceClient()
    const { data: tasks, error } = await supabase.from('tasks').select('*')
    if (error || !tasks) {
      console.error('[push] Supabase fetch failed:', error)
      return
    }

    const report = computeRoadmapReport(tasks)

    const res = await fetch(`${skUrl.replace(/\/$/, '')}/api/provinces/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      body: JSON.stringify(report),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(`[push] SK returned ${res.status}: ${text}`)
    } else {
      console.log('[push] Successfully pushed to Self-Khilafah')
    }
  } catch (err) {
    console.error('[push] Exception during push:', err)
  }
}