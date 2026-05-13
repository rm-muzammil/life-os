// src/app/api/reset-seed/route.ts
// Call this once to delete today's agent-seeded tasks and clear the lock.
// After calling: refresh the dashboard → new Excel tasks appear.
// DELETE this file after you've used it once.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today  = new Date().toISOString().split('T')[0]
  const userId = user.id

  // Delete today's agent-seeded tasks only (keeps your manual tasks)
  const { error, count } = await supabase
    .from('tasks')
    .delete({ count: 'exact' })
    .eq('user_id', userId)
    .eq('due_date', today)
    .eq('source', 'agent')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    deleted: count,
    message: `Deleted ${count} seeded tasks for ${today}. Now clear localStorage and refresh.`,
  })
}