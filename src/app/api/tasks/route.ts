import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

import { waitUntil } from '@vercel/functions'
import { pushToSelfKhilafah } from '@/lib/push'

// GET /api/tasks?date=2026-05-10&status=todo&track=ML
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date   = searchParams.get('date')
  const status = searchParams.get('status')
  const track  = searchParams.get('track')

  let query = supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at')

  if (date)   query = query.eq('due_date', date)
  if (status) query = query.eq('status', status)
  if (track)  query = query.eq('track', track)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/tasks
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase.from('tasks')
    .insert({ ...body, user_id: user.id })
    .select().single()

    waitUntil(pushToSelfKhilafah())
return NextResponse.json(data, { status: 201 })


}

// PATCH /api/tasks?id=xxx
export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = new URL(req.url).searchParams.get('id')
  const body = await req.json()

  if (body.status === 'done') body.completed_at = new Date().toISOString()

  const { data, error } = await supabase.from('tasks')
    .update(body).eq('id', id!).eq('user_id', user.id)
    .select().single()

    waitUntil(pushToSelfKhilafah())
return NextResponse.json(data, { status: 201 })


}

// DELETE /api/tasks?id=xxx
export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  const { error } = await supabase.from('tasks').delete().eq('id', id!).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}