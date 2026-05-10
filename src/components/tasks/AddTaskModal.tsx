'use client'

import { useState } from 'react'
import { type TaskTrack, type TaskPriority, TRACK_META } from '@/types'
import { X } from 'lucide-react'

interface Props {
  onClose: () => void
  onSave: (task: { title: string; track: TaskTrack; priority: TaskPriority; hours: number; notes: string; status: 'todo' }) => Promise<void>
  defaultTrack?: TaskTrack
}

export function AddTaskModal({ onClose, onSave, defaultTrack }: Props) {
  const [title,    setTitle]    = useState('')
  const [track,    setTrack]    = useState<TaskTrack>(defaultTrack ?? 'ML')
  const [priority, setPriority] = useState<TaskPriority>('Medium')
  const [hours,    setHours]    = useState(1.5)
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onSave({ title: title.trim(), track, priority, hours, notes, status: 'todo' })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r3)', padding: 24, width: 480, maxWidth: '95vw' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>+ New Task</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Task Title">
            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Complete PyTorch Chapter 3 notebook"
              style={inputSty} autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Track">
              <select value={track} onChange={e => setTrack(e.target.value as TaskTrack)} style={inputSty}>
                {(Object.keys(TRACK_META) as TaskTrack[]).map(t => (
                  <option key={t} value={t}>{TRACK_META[t].label}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} style={inputSty}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </Field>
          </div>

          <Field label="Estimated Hours">
            <input type="number" value={hours} onChange={e => setHours(parseFloat(e.target.value))}
              min={0.25} max={8} step={0.25} style={inputSty} />
          </Field>

          <Field label="Notes (optional)">
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any details, links, or context…"
              style={{ ...inputSty, height: 72, resize: 'vertical' }} />
          </Field>
        </div>

        {/* Track preview */}
        <div style={{ margin: '14px 0', padding: '8px 12px', background: TRACK_META[track].bg, borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: TRACK_META[track].color }} />
          <span style={{ fontSize: 11, color: TRACK_META[track].color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{TRACK_META[track].label}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {hours}h · {priority} priority</span>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-syne)' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim() || saving} style={{ padding: '9px 18px', background: 'var(--accent)', border: 'none', borderRadius: 'var(--r)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-syne)', opacity: (!title.trim() || saving) ? 0.6 : 1 }}>
            {saving ? 'Adding…' : 'Add Task →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputSty: React.CSSProperties = {
  width: '100%', padding: '9px 12px',
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 'var(--r)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
