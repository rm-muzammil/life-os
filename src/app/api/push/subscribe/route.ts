// src/app/api/push/subscribe/route.ts
// Saves a browser push subscription to Supabase.
// Called when user enables notifications in the app.

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { subscription, notifyHour = 7, timezone = 'UTC' } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const userAgent = req.headers.get('user-agent') ?? ''

    // Upsert — same endpoint = same device, just update keys
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id:     user.id,
        endpoint:    subscription.endpoint,
        p256dh:      subscription.keys.p256dh,
        auth:        subscription.keys.auth,
        user_agent:  userAgent,
        notify_hour: notifyHour,
        timezone,
        active:      true,
      }, { onConflict: 'user_id,endpoint' })

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Subscribed to push notifications' })
  } catch (err: any) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { endpoint } = await req.json()

    await supabase
      .from('push_subscriptions')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('endpoint', endpoint)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
