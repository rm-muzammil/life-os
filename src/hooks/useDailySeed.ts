'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// 1. Module-level variable (exists outside the hook lifecycle)
// This acts as a "Global Lock" for this specific browser tab session.
let isRequestInFlight = false;

interface SeedResult {
  seeded: boolean
  count: number
  source: 'hybrid' | 'fallback'
  week: number
  day: string
  reason?: string
}

export function useDailySeed(onSeeded?: () => void) {
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const key = `roadmap-seeded-${today}`

    // 2. Instant exits
    if (localStorage.getItem(key) === 'true') return
    if (isRequestInFlight) return 

    async function seed() {
      // 3. Lock it immediately
      isRequestInFlight = true
      setSeeding(true)

      try {
        const res = await fetch('/api/seed-today', { method: 'POST' })
        
        if (!res.ok) throw new Error('Seed request failed')
        
        const data = await res.json() as SeedResult

        if (data.seeded || data.reason === 'already_seeded') {
          localStorage.setItem(key, 'true')
          
          if (data.seeded && data.count > 0) {
            toast.success(`📋 ${data.count} tasks loaded for today`, {
              description: `Week ${data.week} · ${data.day}`,
            })
            onSeeded?.()
          }
        }
      } catch (err) {
        console.error('Daily seed failed:', err)
        // If it fails, we UNLOCK so the user can try again on refresh
        isRequestInFlight = false 
      } finally {
        setSeeding(false)
        // Note: We don't set isRequestInFlight to false if successful 
        // because we want the localStorage to handle it from then on.
      }
    }

    const timer = setTimeout(seed, 1000)
    return () => clearTimeout(timer)
  }, [onSeeded])

  return { seeding }
}