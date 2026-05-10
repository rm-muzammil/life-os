'use client'
// src/components/ui/NotificationSettings.tsx
// Embedded in the settings page and sidebar.
// Handles: enable/disable toggle, notify hour picker, test button.

import { usePushNotification } from '@/hooks/usePushNotification'
import { Bell, BellOff, Send, Loader2 } from 'lucide-react'

export function NotificationSettings() {
  const { isSupported, permission, isSubscribed, isLoading, notifyHour, subscribe, unsubscribe, sendTest } = usePushNotification()

  if (!isSupported) {
    return (
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Push notifications are not supported in this browser. Use Chrome on Android or Safari on iOS.
        </div>
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', marginBottom: 4 }}>Notifications blocked</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
          You blocked notifications. To re-enable: tap the lock icon in your browser address bar → Notifications → Allow.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isSubscribed
            ? <Bell size={16} style={{ color: 'var(--green)' }} />
            : <BellOff size={16} style={{ color: 'var(--text3)' }} />
          }
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              {isSubscribed ? 'Notifications on' : 'Morning notifications'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              {isSubscribed
                ? `Daily reminder at ${notifyHour}:00 with your tasks`
                : "Get a reminder when today's tasks are ready"
              }
            </div>
          </div>
        </div>
        <button
          onClick={() => isSubscribed ? unsubscribe() : subscribe(notifyHour)}
          disabled={isLoading}
          style={{
            padding: '7px 14px', borderRadius: 'var(--r)', border: 'none',
            cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 5,
            background: isSubscribed ? 'rgba(239,68,68,0.12)' : 'var(--accent)',
            color: isSubscribed ? '#ef4444' : '#fff',
            opacity: isLoading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
        >
          {isLoading
            ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Loading</>
            : isSubscribed ? 'Disable' : 'Enable'
          }
        </button>
      </div>

      {/* Notify hour picker — only when subscribed */}
      {isSubscribed && (
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Notification time</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[5, 6, 7, 8, 9].map(h => (
              <button
                key={h}
                onClick={() => subscribe(h)}
                style={{
                  padding: '5px 12px', borderRadius: 'var(--r)', border: '1px solid',
                  borderColor: notifyHour === h ? 'var(--accent)' : 'var(--border)',
                  background: notifyHour === h ? 'rgba(124,92,252,0.15)' : 'var(--bg4)',
                  color: notifyHour === h ? 'var(--accent)' : 'var(--text2)',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)',
                }}
              >
                {h}:00 {h < 12 ? 'AM' : 'PM'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test button — only when subscribed */}
      {isSubscribed && (
        <button
          onClick={sendTest}
          style={{ padding: '9px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-syne)', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text2)' }}
        >
          <Send size={13} /> Send test notification now
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
