'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TRACK_META, type Task, type TaskTrack } from '@/types'
import { AddTaskModal } from '@/components/tasks/AddTaskModal'
import { toast } from 'sonner'
import { Plus, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

export default function BoardPage() {
  const supabase = createClient()
  const today    = format(new Date(), 'yyyy-MM-dd')

  const [tasks,       setTasks]       = useState<Task[]>([])
  const [showModal,   setShowModal]   = useState(false)
  const [filterTrack, setFilterTrack] = useState<TaskTrack | null>(null)
  const [filterDate,  setFilterDate]  = useState<'today' | 'all'>('today')
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { loadTasks() }, [filterTrack, filterDate])

  async function loadTasks() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let q = supabase.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (filterTrack) q = q.eq('track', filterTrack)
    if (filterDate === 'today') q = q.eq('due_date', today)

    const { data } = await q
    if (data) setTasks(data)
    setLoading(false)
  }

  async function updateStatus(id: string, status: Task['status']) {
    await supabase.from('tasks').update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (status === 'done') toast.success('Task complete! 🎉')
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.info('Task removed')
  }

  const filtered = filterTrack ? tasks.filter(t => t.track === filterTrack) : tasks
  const cols: { status: Task['status']; label: string; color: string }[] = [
    { status: 'todo',       label: '📋 Backlog',    color: 'var(--text3)' },
    { status: 'inprogress', label: '▶ In Progress', color: 'var(--cloud)' },
    { status: 'done',       label: '✓ Done',        color: 'var(--green)' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>Task Board</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {filterTrack ? `Filtering: ${filterTrack}` : 'All tracks'} · {filtered.length} tasks
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Date filter */}
          <div style={{ display: 'flex', gap: 2, background: 'var(--bg3)', borderRadius: 'var(--r)', padding: 3, border: '1px solid var(--border)' }}>
            {(['today', 'all'] as const).map(d => (
              <button key={d} onClick={() => setFilterDate(d)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-syne)', background: filterDate === d ? 'var(--bg4)' : 'transparent', color: filterDate === d ? 'var(--text)' : 'var(--text2)' }}>
                {d === 'today' ? 'Today' : 'All time'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '7px 13px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={13} /> Add Task
          </button>
        </div>
      </div>

      {/* Track filter pills */}
      <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button onClick={() => setFilterTrack(null)} style={{ padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)', background: !filterTrack ? 'var(--bg4)' : 'transparent', color: !filterTrack ? 'var(--text)' : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
          All
        </button>
        {(Object.entries(TRACK_META) as [TaskTrack, { color: string; bg: string; label: string }][]).map(([track, meta]) => (
          <button key={track} onClick={() => setFilterTrack(filterTrack === track ? null : track)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1px solid ${filterTrack === track ? meta.color : 'var(--border)'}`, background: filterTrack === track ? meta.bg : 'transparent', color: filterTrack === track ? meta.color : 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }}>
            {meta.label}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {cols.map(({ status, label, color }) => {
          const colTasks = filtered.filter(t => t.status === status)
          return (
            <div key={status} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: 14, minHeight: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg4)', padding: '2px 7px', borderRadius: 20, fontFamily: 'var(--font-mono)' }}>{colTasks.length}</div>
              </div>

              {status === 'todo' && (
                <button onClick={() => setShowModal(true)} style={{ width: '100%', padding: '8px 0', background: 'transparent', border: '1px dashed var(--border2)', borderRadius: 'var(--r)', color: 'var(--text3)', fontSize: 12, cursor: 'pointer', marginBottom: 8, fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Plus size={12} /> Add task
                </button>
              )}

              {colTasks.length === 0 && <div style={{ fontSize: 11, color: 'var(--text3)', padding: '8px 0' }}>Empty</div>}

              {colTasks.map(t => {
                const meta = TRACK_META[t.track as keyof typeof TRACK_META] ?? { color: 'var(--text3)', bg: 'var(--bg4)', label: t.track }
                return (
                  <motion.div key={t.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderLeft: `3px solid ${meta.color}`, borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 8, opacity: t.status === 'done' ? 0.55 : 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)' }}>{t.track}</span>
                      <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{t.due_date} · {t.hours}h</span>
                      {t.source === 'agent' && <span style={{ fontSize: 9, color: 'var(--pink)', fontFamily: 'var(--font-mono)' }}>🤖</span>}
                    </div>
                    {t.notes && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>{t.notes}</div>}
                    <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                      {t.status !== 'done' && <button onClick={() => updateStatus(t.id, 'done')} style={tbtn('#10b981', 'rgba(16,185,129,0.12)')}>✓ Done</button>}
                      {t.status === 'todo'  && <button onClick={() => updateStatus(t.id, 'inprogress')} style={tbtn('var(--accent)', 'rgba(124,92,252,0.12)')}>▶ Start</button>}
                      {t.status === 'inprogress' && <button onClick={() => updateStatus(t.id, 'todo')} style={tbtn('var(--text3)', 'var(--bg4)')}>⏸</button>}
                      <button onClick={() => deleteTask(t.id)} style={tbtn('#ef4444', 'rgba(239,68,68,0.1)')}>✕</button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )
        })}
      </div>

      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          defaultTrack={filterTrack ?? undefined}
          onSave={async (task) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase.from('tasks').insert({ ...task, user_id: user.id, due_date: today }).select().single()
            if (data) { setTasks(prev => [data, ...prev]); toast.success('Task added!') }
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

function tbtn(color: string, bg: string): React.CSSProperties {
  return { padding: '3px 9px', background: bg, color, border: 'none', borderRadius: 4, fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 600 }
}