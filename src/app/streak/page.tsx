'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { format, subDays, eachDayOfInterval, startOfWeek, addWeeks } from 'date-fns'
import { type Streak, TRACK_META } from '@/types'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function StreakPage() {
  const supabase = createClient()
  const today    = format(new Date(), 'yyyy-MM-dd')

  const [streaks,   setStreaks]   = useState<Streak[]>([])
  const [trackDone, setTrackDone] = useState<Record<string, number>>({})
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [streakRes, taskRes] = await Promise.all([
      supabase.from('streaks').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('track').eq('user_id', user.id).eq('status', 'done'),
    ])

    if (streakRes.data) setStreaks(streakRes.data)
    if (taskRes.data) {
      const counts: Record<string, number> = {}
      taskRes.data.forEach(t => { counts[t.track] = (counts[t.track] ?? 0) + 1 })
      setTrackDone(counts)
    }
    setLoading(false)
  }

  // ── Build 52-week grid ──────────────────────────────────────
  const { weeks, monthLabels } = useMemo(() => {
    const gridStart = startOfWeek(subDays(new Date(), 363))
    const streakMap = Object.fromEntries(streaks.map(s => [s.date, s.level]))

    const weeks: { date: Date; ds: string; level: number; isToday: boolean; isFuture: boolean }[][] = []
    let monthLabels: { weekIdx: number; label: string }[] = []
    let lastMonth = -1

    for (let w = 0; w < 53; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = addWeeks(gridStart, w)
        const dCur = new Date(date)
        dCur.setDate(dCur.getDate() + d)
        const ds = format(dCur, 'yyyy-MM-dd')
        const isFuture = dCur > new Date()
        week.push({ date: dCur, ds, level: isFuture ? -1 : (streakMap[ds] ?? 0), isToday: ds === today, isFuture })

        if (!isFuture && dCur.getMonth() !== lastMonth) {
          monthLabels.push({ weekIdx: w, label: format(dCur, 'MMM') })
          lastMonth = dCur.getMonth()
        }
      }
      weeks.push(week)
    }
    return { weeks, monthLabels }
  }, [streaks, today])

  // ── Streak stats ────────────────────────────────────────────
  const { currentStreak, longestStreak, activeDays } = useMemo(() => {
    const sorted = [...streaks].sort((a, b) => b.date.localeCompare(a.date))
    let current = 0
    for (const s of sorted) { if (s.level > 0) current++; else break }

    let longest = 0, cur = 0
    const allDates = eachDayOfInterval({ start: subDays(new Date(), 365), end: new Date() })
    const map = Object.fromEntries(streaks.map(s => [s.date, s.level]))
    for (const d of allDates) {
      const ds = format(d, 'yyyy-MM-dd')
      if ((map[ds] ?? 0) > 0) { cur++; longest = Math.max(longest, cur) } else cur = 0
    }

    return { currentStreak: current, longestStreak: longest, activeDays: streaks.filter(s => s.level > 0).length }
  }, [streaks])

  async function markToday(level: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const existing = streaks.find(s => s.date === today)
    if (existing) {
      await supabase.from('streaks').update({ level }).eq('id', existing.id)
      setStreaks(prev => prev.map(s => s.date === today ? { ...s, level } : s))
    } else {
      const { data } = await supabase.from('streaks').insert({ user_id: user.id, date: today, level }).select().single()
      if (data) setStreaks(prev => [...prev, data])
    }
    toast.success(level >= 4 ? '🔥 Full day marked!' : '✓ Day saved')
  }

  const todayLevel = streaks.find(s => s.date === today)?.level ?? 0

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Streak & Activity</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>GitHub-style · Every day counts</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4].map(lvl => (
            <button key={lvl} onClick={() => markToday(lvl)} style={{ padding: '6px 12px', background: todayLevel >= lvl ? 'rgba(61,220,132,0.15)' : 'var(--bg3)', border: `1px solid ${todayLevel >= lvl ? 'var(--green)' : 'var(--border)'}`, borderRadius: 'var(--r)', color: todayLevel >= lvl ? 'var(--green)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
              {lvl === 4 ? '✓ Full' : `L${lvl}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Stats */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { val: `${currentStreak}🔥`, label: 'CURRENT STREAK', color: 'var(--green)', border: 'var(--green)' },
            { val: longestStreak,        label: 'LONGEST STREAK',  color: 'var(--amber)', border: 'var(--data)' },
            { val: activeDays,           label: 'ACTIVE DAYS',     color: 'var(--cloud)', border: 'var(--cloud)' },
            { val: todayLevel > 0 ? `L${todayLevel}` : '—', label: 'TODAY', color: todayLevel > 0 ? 'var(--green)' : 'var(--text3)', border: todayLevel > 0 ? 'var(--green)' : 'var(--border)' },
          ].map(({ val, label, color, border }) => (
            <motion.div key={label} className="animate-slide-up" style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderTop: `2px solid ${border}`, borderRadius: 'var(--r2)', padding: 16 }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>365-Day Activity Grid</div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{currentStreak} day streak 🔥</div>
          </div>

          {/* Month labels */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 4, paddingLeft: 0, overflowX: 'auto' }}>
            {monthLabels.slice(0, 12).map((m, i) => (
              <div key={i} style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', minWidth: 40 }}>{m.label}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: 3, overflowX: 'auto' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {week.map((cell, di) => (
                  <div key={di}
                    title={`${cell.ds}: ${cell.level > 0 ? 'Level ' + cell.level : 'No activity'}`}
                    onClick={() => !cell.isFuture && cell.isToday && markToday(cell.level < 4 ? cell.level + 1 : 0)}
                    style={{
                      width: 13, height: 13, borderRadius: 2,
                      cursor: cell.isToday ? 'pointer' : 'default',
                      opacity: cell.isFuture ? 0.15 : 1,
                      outline: cell.isToday ? '1px solid var(--green)' : 'none',
                      outlineOffset: 1,
                      transition: 'transform 0.1s',
                    }}
                    className={`streak-${Math.max(0, cell.level)}`}
                    onMouseEnter={e => { if (!cell.isFuture) (e.target as HTMLElement).style.transform = 'scale(1.4)' }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)' }}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>Less</span>
            {[0,1,2,3,4].map(l => <div key={l} className={`streak-${l}`} style={{ width: 11, height: 11, borderRadius: 2 }} />)}
            <span style={{ fontSize: 9, color: 'var(--text3)' }}>More</span>
            <span style={{ fontSize: 9, color: 'var(--text3)', marginLeft: 8 }}>Click today to update level</span>
          </div>
        </div>

        {/* Track breakdown */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Tasks Completed by Track</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(Object.entries(TRACK_META) as [string, { color: string; bg: string; label: string }][])
              .map(([track, meta]) => {
                const count = trackDone[track] ?? 0
                const max   = Math.max(...Object.values(trackDone), 1)
                return (
                  <div key={track}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>{meta.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{count} tasks</div>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${count / max * 100}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', borderRadius: 3, background: meta.color }} />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
