'use client'
// src/components/ui/InstallPrompt.tsx
//
// Shows an "Add to Home Screen" banner when:
//   - User is on mobile
//   - App is not already installed
//   - Browser fires the beforeinstallprompt event (Android Chrome)
// Also shows manual instructions for iOS Safari.

import { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner,     setShowBanner]     = useState(false)
  const [showIOS,        setShowIOS]        = useState(false)
  const [installing,     setInstalling]     = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already installed as PWA — don't show
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (isStandalone) return

    // Dismissed recently — don't nag
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 3600 * 1000) return

    // iOS: show manual instructions (no beforeinstallprompt on iOS)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOS) {
      setTimeout(() => setShowIOS(true), 3000)
      return
    }

    // Android Chrome: wait for install prompt event
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowBanner(true), 2000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowBanner(false)
    setShowIOS(false)
    setDeferredPrompt(null)
  }

  async function install() {
    if (!deferredPrompt) return
    setInstalling(true)
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setInstalling(false)
    if (outcome === 'accepted') {
      setShowBanner(false)
      setDeferredPrompt(null)
    }
  }

  // ── Android install banner ─────────────────────────────────────────────
  if (showBanner && deferredPrompt) {
    return (
      <div style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 999,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)', padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', gap: 12,
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#7c5cfc,#5c8afc)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Install RoadmapOS</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Add to home screen for daily task reminders</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={dismiss} style={{ padding: '6px 8px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', cursor: 'pointer', color: 'var(--text3)' }}>
            <X size={14} />
          </button>
          <button onClick={install} disabled={installing} style={{ padding: '6px 14px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r)', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Download size={13} /> {installing ? 'Installing…' : 'Install'}
          </button>
        </div>
      </div>
    )
  }

  // ── iOS manual instructions ────────────────────────────────────────────
  if (showIOS) {
    return (
      <div style={{
        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 999,
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--r2)', padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={16} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: 13, fontWeight: 700 }}>Install RoadmapOS on iOS</div>
          </div>
          <button onClick={dismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['1', 'Tap the Share button', '(box with arrow ↑ at the bottom of Safari)'],
            ['2', 'Scroll down', 'and tap "Add to Home Screen"'],
            ['3', 'Tap "Add"', 'RoadmapOS appears on your home screen'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(124,92,252,0.15)', color: 'var(--accent)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{num}</div>
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
          Use Safari, not Chrome, for iOS install support
        </div>
      </div>
    )
  }

  return null
}
