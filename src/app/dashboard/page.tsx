'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPhase, getCurrentWeek, DAY_FOCUS, TRACK_META, TOTAL_WEEKS, type Task, type UserStats, type Streak } from '@/types'
import { format, isToday } from 'date-fns'
import { toast } from 'sonner'
import { Plus, Bot } from 'lucide-react'
import { AddTaskModal } from '@/components/tasks/AddTaskModal'
import { motion } from 'framer-motion'
import { useDailySeed } from '@/hooks/useDailySeed'
import { WeekPlanPreview } from '@/components/tasks/WeekPlanPreview'

export default function DashboardPage() {
  const supabase  = createClient()
  const today     = format(new Date(), 'yyyy-MM-dd')
  const week      = getCurrentWeek()
  const phase     = getCurrentPhase()
  const dayFocus  = DAY_FOCUS[new Date().getDay()]

  const [tasks,      setTasks]      = useState<Task[]>([])
  const [stats,      setStats]      = useState<UserStats | null>(null)
  const [streak,     setStreak]     = useState(0)
  const [showModal,  setShowModal]  = useState(false)
  const [loading,    setLoading]    = useState(true)

  // ── Auto-seed today's tasks from the 104-week roadmap ────────────────────
  // Runs once per day, populates tasks automatically, then calls loadAll()
  useDailySeed(() => loadAll())

  // ── Week strip state ──────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + i)
    return d
  })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [tasksRes, statsRes, streakRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).eq('due_date', today).order('created_at'),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
      supabase.from('streaks').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(60),
    ])

    if (tasksRes.data)  setTasks(tasksRes.data)
    if (statsRes.data)  setStats(statsRes.data)
    if (streakRes.data) setStreak(calcStreak(streakRes.data))
    setLoading(false)
  }

  function calcStreak(rows: Streak[]) {
    let count = 0
    const sorted = [...rows].sort((a, b) => b.date.localeCompare(a.date))
    for (const row of sorted) {
      if (row.level > 0) count++
      else break
    }
    return count
  }

async function updateStatus(id: string, status: Task['status']) {
  const task = tasks.find(t => t.id === id)!
  const update: Partial<Task> = { status, completed_at: status === 'done' ? new Date().toISOString() : null }
  await supabase.from('tasks').update(update).eq('id', id)
  setTasks(prev => prev.map(t => t.id === id ? { ...t, ...update } : t))

  if (status === 'done') {
    toast.success('Task complete! 🎉')
    await refreshStreak()
  }
  fetch('/api/push-trigger', { method: 'POST' }).catch(() => {})
}

async function deleteTask(id: string) {
  await supabase.from('tasks').delete().eq('id', id)
  setTasks(prev => prev.filter(t => t.id !== id))
  toast.info('Task removed')
  fetch('/api/push-trigger', { method: 'POST' }).catch(() => {})
}

  async function refreshStreak() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const done  = tasks.filter(t => t.status === 'done').length + 1
    const total = tasks.length
    const level = total === 0 ? 0 : done >= total ? 4 : done / total >= 0.75 ? 3 : done / total >= 0.5 ? 2 : 1
    await supabase.from('streaks').upsert({
      user_id: user.id, date: today, level,
      tasks_done: done, tasks_total: total,
    }, { onConflict: 'user_id,date' })
  }

  const todo       = tasks.filter(t => t.status === 'todo')
  const inprogress = tasks.filter(t => t.status === 'inprogress')
  const done       = tasks.filter(t => t.status === 'done')
  const totalT     = tasks.length
  const completePct = totalT > 0 ? Math.round(done.length / totalT * 100) : 0

  if (loading) return <PageSkeleton />

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Today's Command Center</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')} · Week {week} · {dayFocus}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowModal(true)} style={btnGhost}>
            <Plus size={13} /> Manual Task
          </button>
          <a href="/agent" style={{ ...btnPrimary, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={13} /> AI Agent
          </a>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* Phase banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{
          background: 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(59,130,246,0.06))',
          border: '1px solid rgba(124,92,252,0.25)', borderRadius: 'var(--r2)',
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', background: 'rgba(124,92,252,0.15)', padding: '2px 9px', borderRadius: 20, display: 'inline-block', marginBottom: 4 }}>
              PHASE {phase.number}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{phase.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{phase.desc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{week}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>/ {TOTAL_WEEKS} weeks</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{Math.round(week / TOTAL_WEEKS * 100)}% complete</div>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { val: `${completePct}%`, label: 'TODAY DONE',     sub: `${done.length}/${totalT} tasks`,              color: 'var(--accent)', border: 'var(--ml)' },
            { val: `${streak}🔥`,     label: 'DAY STREAK',     sub: 'Keep it going!',                              color: 'var(--green)',  border: 'var(--green)' },
            { val: stats?.total_done ?? 0, label: 'TOTAL DONE', sub: 'All time',                                   color: 'var(--teal)',   border: 'var(--mern)' },
            { val: `${(stats?.total_hours ?? 0).toFixed(1)}h`, label: 'HOURS INVESTED', sub: 'Deep work total',   color: 'var(--amber)',  border: 'var(--data)' },
          ].map(({ val, label, sub, color, border }) => (
            <motion.div key={label} className="animate-slide-up" style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r2)', padding: 16,
              borderTop: `2px solid ${border}`,
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -1, color }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Week strip */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>This Week</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{dayFocus} today</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
            {weekDays.map((d, i) => {
              const isT = isToday(d)
              return (
                <div key={i} style={{
                  borderRadius: 'var(--r)', padding: '10px 8px', textAlign: 'center',
                  background: isT ? 'rgba(124,92,252,0.08)' : 'var(--bg3)',
                  border: `1px solid ${isT ? 'var(--accent)' : 'var(--border)'}`,
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text3)', letterSpacing: '0.08em' }}>
                    {['SUN','MON','TUE','WED','THU','FRI','SAT'][i]}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, margin: '4px 0', color: isT ? 'var(--accent)' : 'var(--text)' }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: 8, color: 'var(--text3)', fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>
                    {DAY_FOCUS[i].split(' ')[0]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Week plan preview — expand to see all pre-planned tasks, click + to add any */}
        <WeekPlanPreview onTaskAdded={() => loadAll()} />

        {/* Task columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <TaskColumn title="📋 To Do" color="var(--text3)" tasks={todo}
            onAdd={() => setShowModal(true)}
            onComplete={id => updateStatus(id, 'done')}
            onStart={id => updateStatus(id, 'inprogress')}
            onDelete={deleteTask} />
          <TaskColumn title="▶ In Progress" color="var(--cloud)" tasks={inprogress}
            onComplete={id => updateStatus(id, 'done')}
            onPause={id => updateStatus(id, 'todo')}
            onDelete={deleteTask} />
          <TaskColumn title="✓ Done" color="var(--green)" tasks={done}
            onDelete={deleteTask} />
        </div>
      </div>

      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
onSave={async (task) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data } = await supabase.from('tasks').insert({ ...task, user_id: user.id, due_date: today }).select().single()
  if (data) { setTasks(prev => [...prev, data]); toast.success('Task added!') }
  setShowModal(false)
  fetch('/api/push-trigger', { method: 'POST' }).catch(() => {})
}}
        />
      )}
    </div>
  )
}

// ── TaskColumn ─────────────────────────────────────────────────
function TaskColumn({ title, color, tasks, onAdd, onComplete, onStart, onPause, onDelete }: {
  title: string; color: string; tasks: Task[];
  onAdd?: () => void; onComplete?: (id: string) => void;
  onStart?: (id: string) => void; onPause?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 14, minHeight: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{title}</div>
        <div style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg4)', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-mono)' }}>{tasks.length}</div>
      </div>
      {onAdd && (
        <button onClick={onAdd} style={{ width: '100%', padding: '8px 12px', background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 'var(--r)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', marginBottom: 8, fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <Plus size={12} /> Add task
        </button>
      )}
      {tasks.length === 0 && <div style={{ fontSize: 11, color: 'var(--text3)', padding: '8px 0' }}>Empty</div>}
      {tasks.map(t => (
        <TaskCard key={t.id} task={t}
          onComplete={onComplete} onStart={onStart} onPause={onPause} onDelete={onDelete} />
      ))}
    </div>
  )
}

// ── TaskCard ───────────────────────────────────────────────────
function TaskCard({ task: t, onComplete, onStart, onPause, onDelete }: {
  task: Task; onComplete?: (id: string) => void;
  onStart?: (id: string) => void; onPause?: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TRACK_META[t.track as keyof typeof TRACK_META] ?? { color: 'var(--text3)', bg: 'var(--bg4)', label: t.track }
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 8,
        opacity: t.status === 'done' ? 0.5 : 1,
      }}>
      <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
        {t.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}>{t.track}</span>
        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-mono)', background: t.priority === 'High' ? 'rgba(239,68,68,0.12)' : t.priority === 'Medium' ? 'rgba(245,158,11,0.12)' : 'var(--bg4)', color: t.priority === 'High' ? '#ef4444' : t.priority === 'Medium' ? '#f59e0b' : 'var(--text3)' }}>{t.priority}</span>
        <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{t.hours}h</span>
        {t.source === 'agent' && <span style={{ fontSize: 9, color: 'var(--pink)', fontFamily: 'var(--font-mono)' }}>🤖 agent</span>}
      </div>
      {t.notes && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-mono)', lineHeight: 1.4 }}>{t.notes}</div>}
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {onComplete && t.status !== 'done' && (
          <button onClick={() => onComplete(t.id)} style={taskBtn('#10b981', 'rgba(16,185,129,0.12)')}>✓ Done</button>
        )}
        {onStart && (
          <button onClick={() => onStart(t.id)} style={taskBtn('var(--accent)', 'rgba(124,92,252,0.12)')}>▶ Start</button>
        )}
        {onPause && (
          <button onClick={() => onPause(t.id)} style={taskBtn('var(--text3)', 'var(--bg4)')}>⏸</button>
        )}
        <button onClick={() => onDelete(t.id)} style={taskBtn('#ef4444', 'rgba(239,68,68,0.1)')}>✕</button>
      </div>
    </motion.div>
  )
}

function taskBtn(color: string, bg: string): React.CSSProperties {
  return { padding: '3px 9px', background: bg, color, border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }
}

const btnGhost: React.CSSProperties = { padding: '7px 13px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 6 }
const btnPrimary: React.CSSProperties = { padding: '7px 13px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)' }

function PageSkeleton() {
  return (
    <div style={{ padding: 24 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, background: 'var(--bg2)', borderRadius: 'var(--r2)', marginBottom: 12, opacity: 0.5 }} />
      ))}
    </div>
  )
}
