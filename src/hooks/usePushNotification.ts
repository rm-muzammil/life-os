'use client'
// src/hooks/usePushNotification.ts
//
// Manages the entire push notification lifecycle:
//   1. Check browser support
//   2. Request permission
//   3. Subscribe via service worker
//   4. Save subscription to Supabase via /api/push/subscribe
//   5. Expose state: isSupported, isSubscribed, isLoading, subscribe, unsubscribe

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export type NotificationPermission = 'default' | 'granted' | 'denied'

export interface PushState {
  isSupported:  boolean
  permission:   NotificationPermission
  isSubscribed: boolean
  isLoading:    boolean
  notifyHour:   number
}

export function usePushNotification() {
  const [state, setState] = useState<PushState>({
    isSupported:  false,
    permission:   'default',
    isSubscribed: false,
    isLoading:    true,
    notifyHour:   7,
  })

  // ── Init: check existing subscription on mount ──────────────────────────
  useEffect(() => {
    async function init() {
      // SSR guard
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(s => ({ ...s, isSupported: false, isLoading: false }))
        return
      }

      const permission = Notification.permission as NotificationPermission

      try {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setState(s => ({
          ...s,
          isSupported:  true,
          permission,
          isSubscribed: !!sub,
          isLoading:    false,
        }))
      } catch {
        setState(s => ({ ...s, isSupported: true, permission, isLoading: false }))
      }
    }

    init()
  }, [])

  // ── Subscribe ───────────────────────────────────────────────────────────
  const subscribe = useCallback(async (notifyHour = 7) => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      // 1. Request permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Notification permission denied. Enable it in browser settings.')
        setState(s => ({ ...s, permission: permission as NotificationPermission, isLoading: false }))
        return false
      }

      // 2. Get service worker registration
      const reg = await navigator.serviceWorker.ready

      // 3. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY not set')

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      // 4. Save to server
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const res = await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subscription, notifyHour, timezone }),
      })

      if (!res.ok) throw new Error('Failed to save subscription')

      setState(s => ({
        ...s,
        permission:   'granted',
        isSubscribed: true,
        isLoading:    false,
        notifyHour,
      }))

      toast.success(`✓ Notifications enabled — you'll get a reminder at ${formatHour(notifyHour)} daily`)
      return true

    } catch (err: any) {
      console.error('Subscribe error:', err)
      toast.error(`Failed to enable notifications: ${err.message}`)
      setState(s => ({ ...s, isLoading: false }))
      return false
    }
  }, [])

  // ── Unsubscribe ─────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true }))
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()

      if (sub) {
        await fetch('/api/push/subscribe', {
          method:  'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }

      setState(s => ({ ...s, isSubscribed: false, isLoading: false }))
      toast.info('Notifications disabled')
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
      setState(s => ({ ...s, isLoading: false }))
    }
  }, [])

  // ── Send test notification ───────────────────────────────────────────────
  const sendTest = useCallback(async () => {
    try {
      const res  = await fetch('/api/push/send', { method: 'POST' })
      const data = await res.json()
      if (res.ok) toast.success(`Test sent to ${data.sent} device(s)`)
      else        toast.error(data.error)
    } catch {
      toast.error('Failed to send test notification')
    }
  }, [])

  return { ...state, subscribe, unsubscribe, sendTest }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = window.atob(base64)
  const output   = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i)
  return output
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h    = hour % 12 || 12
  return `${h}:00 ${ampm}`
}
