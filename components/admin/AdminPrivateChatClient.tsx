'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { linkifyText } from '@/lib/linkify'
import type { PrivateMessage, ChatReaction } from '@/lib/types'

const QUICK_EMOJIS = ['😊', '❤️', '🙏', '🌿', '💪', '🔥', '👏']
const REACTION_EMOJIS = ['❤️', '👍', '😂', '🥲', '🙏', '💪']

interface Props {
  conversationId: string
  currentUserId: string
}

function groupReactions(reactions: ChatReaction[] = [], currentUserId: string) {
  const map = new Map<string, { count: number; mine: boolean }>()
  for (const r of reactions) {
    const prev = map.get(r.emoji) ?? { count: 0, mine: false }
    map.set(r.emoji, { count: prev.count + 1, mine: prev.mine || r.user_id === currentUserId })
  }
  return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }))
}

function MessageBubble({
  msg, isOwn, currentUserId, onReact, onEdit,
}: {
  msg: PrivateMessage
  isOwn: boolean
  currentUserId: string
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => Promise<void>
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(msg.content)
  const [saving, setSaving] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const time = new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  const reactionGroups = groupReactions(msg.reactions, currentUserId)
  const isOptimistic = msg.id.startsWith('tmp-')

  useEffect(() => {
    if (!showPicker) return
    function h(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showPicker])

  async function saveEdit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === msg.content) { setIsEditing(false); return }
    setSaving(true)
    await onEdit(msg.id, trimmed)
    setSaving(false)
    setIsEditing(false)
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex flex-col gap-0.5 max-w-[80%] md:max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {isEditing ? (
          <div className="bg-white border-2 border-brand-400 rounded-2xl px-4 py-2.5 min-w-[160px]">
            <textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                if (e.key === 'Escape') { setIsEditing(false); setDraft(msg.content) }
              }}
              rows={2}
              className="w-full resize-none text-[15px] md:text-sm text-gray-900 bg-transparent focus:outline-none leading-relaxed"
            />
            <div className="flex gap-3 mt-1.5">
              <button onClick={saveEdit} disabled={saving || !draft.trim()} className="text-xs font-semibold text-brand-600 disabled:opacity-40">
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
              <button onClick={() => { setIsEditing(false); setDraft(msg.content) }} className="text-xs text-gray-400">Anulează</button>
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-2.5 ${
            isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          } ${isOptimistic ? 'opacity-70' : ''}`}>
            <p className="text-[15px] md:text-sm whitespace-pre-wrap break-words leading-relaxed">
              {linkifyText(msg.content, isOwn
                ? 'underline break-all opacity-80 hover:opacity-100 text-white'
                : 'underline break-all opacity-80 hover:opacity-100 text-gray-700')}
            </p>
            <p className={`text-[11px] mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>
              {time}{msg.edited_at ? ' · editat' : ''}
            </p>
          </div>
        )}

        {/* Reaction badges */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactionGroups.map(({ emoji, count, mine }) => (
              <button key={emoji} onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors ${
                  mine ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                <span>{emoji}</span><span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isOptimistic && (
          <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className="relative" ref={pickerRef}>
              <button onClick={() => setShowPicker(p => !p)} className="text-sm text-gray-400 hover:text-gray-600 px-1" title="Reacționează">😊</button>
              {showPicker && (
                <div className={`absolute bottom-full mb-1 z-20 flex gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 ${isOwn ? 'right-0' : 'left-0'}`}>
                  {REACTION_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(msg.id, e); setShowPicker(false) }} className="text-lg hover:scale-125 active:scale-110 transition-transform leading-none">{e}</button>
                  ))}
                </div>
              )}
            </div>
            {isOwn && !isEditing && (
              <button onClick={() => { setIsEditing(true); setDraft(msg.content) }} className="text-xs text-gray-400 hover:text-gray-600 px-1" title="Editează">✏️</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPrivateChatClient({ conversationId, currentUserId }: Props) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  function scrollToBottom(smooth = false) {
    const el = scrollRef.current
    if (!el) return
    smooth ? el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }) : (el.scrollTop = el.scrollHeight)
  }

  function markRead() {
    fetch(`/api/conversations/${conversationId}/messages`, { method: 'PATCH' }).catch(() => {})
  }

  useEffect(() => {
    markRead()
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then((data: PrivateMessage[]) => { setMessages(data); setTimeout(() => scrollToBottom(false), 50) })

    const channel = supabase
      .channel(`admin-conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as PrivateMessage
        setMessages(prev => {
          const withoutOptimistic = prev.filter(m =>
            !(m.id.startsWith('tmp-') && m.sender_id === incoming.sender_id && m.content === incoming.content)
          )
          return [...withoutOptimistic, incoming]
        })
        setTimeout(() => scrollToBottom(true), 50)
        markRead()
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const updated = payload.new as PrivateMessage
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, content: updated.content, edited_at: updated.edited_at } : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const handleReact = useCallback((msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const reactions = m.reactions ?? []
      const idx = reactions.findIndex(r => r.emoji === emoji && r.user_id === currentUserId)
      return { ...m, reactions: idx >= 0 ? reactions.filter((_, i) => i !== idx) : [...reactions, { emoji, user_id: currentUserId }] }
    }))
    fetch('/api/private-reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId, emoji }),
    }).catch(() => {})
  }, [currentUserId])

  const handleEdit = useCallback(async (msgId: string, content: string) => {
    const res = await fetch(`/api/private-messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content, edited_at: new Date().toISOString() } : m))
    }
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError(null)

    const optimistic: PrivateMessage = {
      id: `tmp-${Date.now()}`, conversation_id: conversationId,
      sender_id: currentUserId, content: trimmed, read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setTimeout(() => scrollToBottom(true), 30)

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
    setSending(false)
    if (!res.ok) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la trimitere')
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-12">Niciun mesaj încă.</p>}
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isOwn={msg.sender_id === currentUserId}
            currentUserId={currentUserId}
            onReact={handleReact}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs flex-shrink-0">ok</button>
        </div>
      )}

      <div className="flex gap-1 px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex-shrink-0">
        {QUICK_EMOJIS.map(emoji => (
          <button key={emoji} type="button" onClick={() => setText(prev => prev + emoji)}
            className="text-xl leading-none hover:scale-125 active:scale-110 transition-transform" aria-label={emoji}>
            {emoji}
          </button>
        ))}
      </div>

      <form onSubmit={handleSend} className="bg-white px-3 pb-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[15px] md:text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white transition-colors"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="bg-brand-600 text-white rounded-full w-11 h-11 md:w-9 md:h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 active:scale-95 transition-all">
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </form>
    </div>
  )
}
