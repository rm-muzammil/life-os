// src/hooks/useDailySeed.ts
//
// Drop this hook into the Dashboard page.
// On first render each day it calls /api/seed-today.
// Uses localStorage to track "last seeded date" so it only runs once per day.
// Shows a toast when tasks are seeded.

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface SeedResult {
  seeded: boolean
  count: number
  source: 'roadmap' | 'ai_generated'
  week: number
  day: string
  reason?: string
}

export function useDailySeed(onSeeded?: () => void) {
  const [seeding,    setSeeding]    = useState(false)
  const [seedResult, setSeedResult] = useState<SeedResult | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const key   = `roadmap-seeded-${today}`

    // Already seeded today? Skip (localStorage check = instant, no API call)
    if (localStorage.getItem(key) === 'true') return

    async function seed() {
      setSeeding(true)
      try {
        const res  = await fetch('/api/seed-today', { method: 'POST' })
        const data = await res.json() as SeedResult

        setSeedResult(data)

        if (data.seeded && data.count > 0) {
          localStorage.setItem(key, 'true')
          toast.success(
            `📋 ${data.count} tasks loaded for today`,
            {
              description: `Week ${data.week} · ${data.day} · from ${data.source === 'roadmap' ? 'your roadmap plan' : 'AI generation'}`,
              duration: 4000,
            }
          )
          onSeeded?.()
        } else if (data.reason === 'already_seeded') {
          // Silently mark as done so we don't keep calling the API
          localStorage.setItem(key, 'true')
        }
      } catch (err) {
        console.error('Daily seed failed:', err)
        // Don't show error to user — fail silently
      } finally {
        setSeeding(false)
      }
    }

    // Small delay so dashboard renders first, then seeds
    const timer = setTimeout(seed, 800)
    return () => clearTimeout(timer)
  }, [])

  return { seeding, seedResult }
}
