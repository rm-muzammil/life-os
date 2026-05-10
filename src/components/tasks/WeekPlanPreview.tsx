'use client'

// src/components/tasks/WeekPlanPreview.tsx
//
// Shows the current week's theme + all pre-planned tasks.
// User can click any task to instantly add it to today's board.
// Helps answer "what else should I do today?" without opening Notion.

import { useState } from 'react'
import { getWeekPlan } from '@/lib/weeklyRoadmap'
import { getCurrentWeek, TRACK_META, type TaskTrack } from '@/types'
import { Plus, BookOpen, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Props {
  onTaskAdded?: () => void
}

export function WeekPlanPreview({ onTaskAdded }: Props) {
  const supabase  = createClient()
  const week      = getCurrentWeek()
  const plan      = getWeekPlan(week)
  const [open,    setOpen]    = useState(false)
  const [adding,  setAdding]  = useState<string | null>(null)

  if (!plan) {
    // Week beyond static roadmap — show AI Agent prompt
    return (
      <div style={{
        background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.2)',
        borderRadius: 'var(--r2)', padding: '12px 16px', marginBottom: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>
          Week {week} tasks are AI-generated. Check the Agent tab for your plan.
        </div>
        <a href="/agent" style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', textDecoration: 'none' }}>
          Open agent →
        </a>
      </div>
    )
  }

  async function addTask(task: typeof plan.tasks[0]) {
    setAdding(task.title)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = format(new Date(), 'yyyy-MM-dd')

      const { error } = await supabase.from('tasks').insert({
        user_id:  user.id,
        title:    task.title,
        track:    task.track,
        priority: task.priority,
        hours:    task.hours,
        notes:    task.notes,
        status:   'todo',
        due_date: today,
        source:   'agent',
      })

      if (error) throw error
      toast.success('Task added to today\'s board')
      onTaskAdded?.()
    } catch (err) {
      toast.error('Failed to add task')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', marginBottom: 16, overflow: 'hidden',
    }}>
      {/* Header — always visible */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left',
      }}>
        <BookOpen size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
            Week {week} Plan: {plan.theme}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {plan.tasks.length} tasks pre-planned · click to expand
          </div>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          : <ChevronDown size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
        }
      </button>

      {/* Expandable task list */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '8px 12px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', padding: '6px 4px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            All tasks this week — click + to add to today
          </div>
          {plan.tasks.map((task, i) => {
            const meta    = TRACK_META[task.track as TaskTrack]
            const loading = adding === task.title
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '8px 6px', borderRadius: 'var(--r)',
                borderBottom: i < plan.tasks.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, marginBottom: 4 }}>
                    {task.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}>
                      {task.track}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                      {task.hours}h · {task.priority}
                    </span>
                    {task.notes && (
                      <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                        · {task.notes.slice(0, 50)}{task.notes.length > 50 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => addTask(task)}
                  disabled={loading}
                  title="Add to today's board"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)',
                    background: 'var(--bg3)', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,92,252,0.15)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  {loading
                    ? <div style={{ width: 10, height: 10, border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : <Plus size={12} style={{ color: 'var(--accent)' }} />
                  }
                </button>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
