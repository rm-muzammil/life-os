'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getCurrentPhase, getCurrentWeek, DAY_FOCUS, TRACK_META, type TaskTrack, type TaskPriority } from '@/types'
import { toast } from 'sonner'
import { Send, Bot, Zap, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AgentTask {
  title: string; track: TaskTrack; priority: TaskPriority; hours: number; notes: string
}
interface Message {
  role: 'user' | 'assistant'
  content: string
  tasks?: AgentTask[]
  added?: boolean
}

const QUICK_PROMPTS = [
  `Create today's ML tasks for week ${getCurrentWeek()}`,
  'Generate a sprint for Project 1: GDPR RAG chatbot',
  'Add German study tasks for B1 preparation',
  'Plan my MERN freelance tasks this week',
  'What should I focus on in the current phase?',
  'Create cloud tasks: AWS setup and Terraform basics',
]

export default function AgentPage() {
  const supabase   = createClient()
  const phase      = getCurrentPhase()
  const week       = getCurrentWeek()
  const dayFocus   = DAY_FOCUS[new Date().getDay()]
  const today      = new Date().toISOString().split('T')[0]

  const [messages, setMessages] = useState<Message[]>([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendMessage(text?: string) {
    const prompt = (text ?? input).trim()
    if (!prompt || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: prompt }])
    setLoading(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, week, phase: phase.name, dayFocus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Agent error')

      setMessages(prev => [...prev, { role: 'assistant', content: data.message, tasks: data.tasks }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  async function addTasksToBoard(msgIdx: number) {
    const msg = messages[msgIdx]
    if (!msg.tasks?.length) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const rows = msg.tasks.map(t => ({
      user_id: user.id, title: t.title, track: t.track,
      priority: t.priority, hours: t.hours, notes: t.notes,
      status: 'todo' as const, due_date: today, source: 'agent' as const,
    }))

    const { error } = await supabase.from('tasks').insert(rows)
    if (error) { toast.error('Failed to add tasks'); return }

    setMessages(prev => prev.map((m, i) => i === msgIdx ? { ...m, added: true } : m))
    toast.success(`✓ ${rows.length} tasks added to your board!`)

    // Log to agent_logs
    await supabase.from('agent_logs').insert({
      user_id: user.id,
      prompt: messages[msgIdx - 1]?.content ?? '',
      response: msg.content,
      tasks_created: rows.length,
      week_number: week,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0, borderTop: '2px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>AI Task Agent</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              Week {week} · Phase {phase.number}: {phase.name} · Today: {dayFocus}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 20 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>RoadmapOS Agent</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                I know your full 2-year Germany roadmap. Tell me what you need and I'll generate specific,
                actionable tasks and add them directly to your board.
              </div>
            </div>

            {/* Phase context */}
            <div style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.2)', borderRadius: 'var(--r2)', padding: '12px 16px', marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 4 }}>CURRENT CONTEXT</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                Week {week} · Phase {phase.number} ({phase.name}) · {phase.desc}
              </div>
            </div>

            {/* Quick prompts */}
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>QUICK PROMPTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ padding: '7px 13px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'var(--accent)'; (e.target as HTMLElement).style.color = 'var(--text)' }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text2)' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ marginBottom: 16, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>

              {msg.role === 'user' ? (
                <div style={{ background: 'var(--accent)', color: '#fff', borderRadius: 'var(--r2) var(--r2) 4px var(--r2)', padding: '10px 14px', maxWidth: '70%', fontSize: 13, lineHeight: 1.5 }}>
                  {msg.content}
                </div>
              ) : (
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={12} color="#fff" />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>RoadmapOS Agent</div>
                  </div>

                  <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '4px var(--r2) var(--r2) var(--r2)', padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: msg.tasks?.length ? 12 : 0 }}>{msg.content}</div>

                    {msg.tasks && msg.tasks.length > 0 && (
                      <div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
                          GENERATED {msg.tasks.length} TASKS
                        </div>
                        {msg.tasks.map((t, ti) => {
                          const meta = TRACK_META[t.track as keyof typeof TRACK_META] ?? { color: 'var(--text3)', bg: 'var(--bg4)', label: t.track }
                          return (
                            <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.color, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{t.track}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{t.title}</span>
                              <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{t.hours}h</span>
                            </div>
                          )
                        })}

                        <button onClick={() => addTasksToBoard(i)} disabled={msg.added} style={{ marginTop: 12, padding: '8px 16px', background: msg.added ? 'rgba(61,220,132,0.15)' : 'var(--accent)', border: msg.added ? '1px solid var(--green)' : 'none', borderRadius: 'var(--r)', color: msg.added ? 'var(--green)' : '#fff', fontSize: 12, fontWeight: 700, cursor: msg.added ? 'default' : 'pointer', fontFamily: 'var(--font-syne)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {msg.added ? '✓ Added to board' : <><Plus size={13} /> Add all to board</>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={12} color="#fff" />
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 24px 16px', borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={`Ask anything… e.g. "Create today's tasks for week ${week}"`}
            disabled={loading}
            style={{ flex: 1, padding: '11px 16px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--r2)', color: 'var(--text)', fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none' }} />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ padding: '11px 16px', background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg3)', border: 'none', borderRadius: 'var(--r2)', color: input.trim() && !loading ? '#fff' : 'var(--text3)', cursor: input.trim() && !loading ? 'pointer' : 'default', transition: 'all 0.15s' }}>
            <Send size={16} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
          Enter to send · Shift+Enter for newline · Tasks are added directly to your board
        </div>
      </div>
    </div>
  )
}
