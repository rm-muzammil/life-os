// src/app/api/push/send/route.ts
//
// TWO ways to trigger morning notifications:
//
// 1. Vercel Cron (recommended — set in vercel.json, runs at 7am UTC daily)
//    GET /api/push/send  → sends to ALL active subscribers whose notify_hour matches
//
// 2. Manual trigger from settings page
//    POST /api/push/send  → sends only to the current user (for testing)

import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentWeek, DAY_FOCUS } from '@/types'

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

function buildPayload(weekNum: number, taskCount: number, dayFocus: string) {
  const phase = weekNum <= 8 ? 1 : weekNum <= 16 ? 2 : weekNum <= 30 ? 3 :
                weekNum <= 52 ? 4 : weekNum <= 78 ? 5 : 6

  return JSON.stringify({
    title:     'RoadmapOS ⚡ Good morning!',
    body:      `${taskCount} tasks ready · Week ${weekNum} · ${dayFocus}`,
    icon:      '/icons/icon-192.png',
    badge:     '/icons/icon-96.png',
    tag:       'daily-tasks',
    url:       '/dashboard',
    taskCount,
    week:      weekNum,
    phase,
  })
}

// ── GET — Vercel Cron job (sends to all users at their notify_hour) ───────────
export async function GET(req: NextRequest) {
  // Verify cron secret so random people can't spam notifications
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role key for reading all subscriptions (bypasses RLS)
  const { createClient } = await import('@supabase/supabase-js')
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const currentHour = new Date().getUTCHours()
  const weekNum     = getCurrentWeek()
  const dayOfWeek   = new Date().getDay()
  const dayFocus    = DAY_FOCUS[dayOfWeek]

  // Get all active subscriptions for users whose notify_hour = current UTC hour
  const { data: subscriptions, error } = await adminSupabase
    .from('push_subscriptions')
    .select('*')
    .eq('active', true)
    .eq('notify_hour', currentHour)

  if (error) {
    console.error('Fetch subscriptions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers at this hour' })
  }

  let sent = 0, failed = 0

  for (const sub of subscriptions) {
    try {
      // Get today's task count for this user
      const today = new Date().toISOString().split('T')[0]
      const { count } = await adminSupabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sub.user_id)
        .eq('due_date', today)

      const taskCount = count ?? 0
      const payload   = buildPayload(weekNum, taskCount, dayFocus)

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )

      // Log success
      await adminSupabase.from('notification_log').insert({
        user_id: sub.user_id,
        type:    'daily_tasks',
        payload: JSON.parse(payload),
        success: true,
      })

      sent++
    } catch (err: any) {
      failed++
      console.error(`Failed to send to ${sub.user_id}:`, err.message)

      // If 410 Gone — subscription expired, deactivate it
      if (err.statusCode === 410) {
        await adminSupabase
          .from('push_subscriptions')
          .update({ active: false })
          .eq('id', sub.id)
      }

      await adminSupabase.from('notification_log').insert({
        user_id:       sub.user_id,
        type:          'daily_tasks',
        success:       false,
        error_message: err.message,
      })
    }
  }

  return NextResponse.json({ sent, failed, total: subscriptions.length })
}

// ── POST — Manual send to current user (test button in settings) ──────────────
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekNum   = getCurrentWeek()
  const dayOfWeek = new Date().getDay()
  const dayFocus  = DAY_FOCUS[dayOfWeek]
  const today     = new Date().toISOString().split('T')[0]

  // Get this user's task count and subscriptions
  const [{ count }, { data: subs }] = await Promise.all([
    supabase.from('tasks').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('due_date', today),
    supabase.from('push_subscriptions').select('*')
      .eq('user_id', user.id).eq('active', true),
  ])

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: 'No active subscriptions. Enable notifications first.' }, { status: 400 })
  }

  const payload = buildPayload(weekNum, count ?? 0, dayFocus)
  let sent = 0

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      sent++
    } catch (err: any) {
      console.error('Test send failed:', err.message)
      if (err.statusCode === 410) {
        await supabase.from('push_subscriptions').update({ active: false }).eq('id', sub.id)
      }
    }
  }

  return NextResponse.json({ sent, message: `Test notification sent to ${sent} device(s)` })
}
