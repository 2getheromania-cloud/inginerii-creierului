'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrivateMessage, ChatReaction } from '@/lib/types'

const REACTION_EMOJIS = ['❤️', '👍', '😂', '🥲', '🙏', '💪']

interface Props {
  conversationId: string
  userId: string
  userName: string
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
  msg, isOwn, userId, isHighlighted,
  onReact, onEdit, onReply, onScrollToMessage,
}: {
  msg: PrivateMessage
  isOwn: boolean
  userId: string
  isHighlighted?: boolean
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => Promise<void>
  onReply: (msg: PrivateMessage) => void
  onScrollToMessage: (id: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(msg.content)
  const [saving, setSaving] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const time = new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  const reactionGroups = groupReactions(msg.reactions, userId)

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

  const isOptimistic = msg.id.startsWith('tmp-')

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex flex-col gap-0.5 max-w-[78%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Bubble */}
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
          <div className={`max-w-full rounded-2xl px-4 py-2.5 transition-colors ${
            isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white shadow-sm text-gray-900 rounded-bl-sm'
          } ${isOptimistic ? 'opacity-70' : ''} ${isHighlighted ? 'ring-2 ring-brand-400' : ''}`}>
            {msg.reply_to && (
              <button
                type="button"
                onClick={() => onScrollToMessage(msg.reply_to!.id)}
                className={`block w-full text-left mb-2 rounded-lg px-2 py-1 border-l-4 ${
                  isOwn ? 'border-brand-300 bg-brand-700/20' : 'border-gray-300 bg-gray-50'
                } hover:opacity-80 transition-opacity`}
              >
                <p className={`text-xs truncate ${isOwn ? 'text-brand-200' : 'text-gray-500'}`}>
                  {msg.reply_to.content}
                </p>
              </button>
            )}
            <p className="text-[15px] md:text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
            <p className={`text-[11px] mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>
              {time}{msg.edited_at ? ' · editat' : ''}
            </p>
          </div>
        )}

        {/* Reaction badges */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactionGroups.map(({ emoji, count, mine }) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors ${
                  mine ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{emoji}</span><span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        {!isOptimistic && (
          <div className={`flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity relative ${isOwn ? 'flex-row-reverse' : ''}`}>
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
            <button onClick={() => onReply(msg)} className="text-xs text-gray-400 hover:text-gray-600 px-1" title="Răspunde">↩️</button>
            {isOwn && !isEditing && (
              <button onClick={() => { setIsEditing(true); setDraft(msg.content) }} className="text-xs text-gray-400 hover:text-gray-600 px-1" title="Editează">✏️</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MesajeClient({ conversationId, userId }: Props) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIdx, setSearchIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messageRefs = useRef<Map<string, HTMLElement>>(new Map())
  const supabase = createClient()

  const searchResultIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return messages.filter(m => m.content.toLowerCase().includes(q)).map(m => m.id)
  }, [messages, searchQuery])

  function scrollToMessage(id: string) {
    const el = messageRefs.current.get(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  useEffect(() => {
    if (searchResultIds.length > 0) scrollToMessage(searchResultIds[searchIdx] ?? searchResultIds[0])
  }, [searchResultIds, searchIdx])

  function scrollToBottom() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }

  function markRead() {
    fetch(`/api/conversations/${conversationId}/messages`, { method: 'PATCH' }).catch(() => {})
  }

  useEffect(() => {
    markRead()
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then((data: PrivateMessage[]) => { setMessages(data); setTimeout(scrollToBottom, 50) })

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as PrivateMessage])
        setTimeout(scrollToBottom, 50)
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

  const handleReact = useCallback((msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m
      const reactions = m.reactions ?? []
      const idx = reactions.findIndex(r => r.emoji === emoji && r.user_id === userId)
      return { ...m, reactions: idx >= 0 ? reactions.filter((_, i) => i !== idx) : [...reactions, { emoji, user_id: userId }] }
    }))
    fetch('/api/private-reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId, emoji }),
    }).catch(() => {})
  }, [userId])

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
    const capturedReplyToId = replyTo?.id ?? null
    setReplyTo(null)
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed, reply_to_id: capturedReplyToId }),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la trimitere')
      return
    }
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0">
          <input
            autoFocus
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchIdx(0) }}
            placeholder="Caută în mesaje..."
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {searchResultIds.length > 0 && (
            <span className="text-xs text-gray-500 whitespace-nowrap">{searchIdx + 1}/{searchResultIds.length}</span>
          )}
          <button type="button" onClick={() => setSearchIdx(i => Math.max(0, i - 1))} disabled={searchResultIds.length === 0 || searchIdx === 0} className="text-gray-500 disabled:opacity-30 text-sm px-1">▲</button>
          <button type="button" onClick={() => setSearchIdx(i => Math.min(searchResultIds.length - 1, i + 1))} disabled={searchResultIds.length === 0 || searchIdx === searchResultIds.length - 1} className="text-gray-500 disabled:opacity-30 text-sm px-1">▼</button>
          <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchIdx(0) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Niciun mesaj încă. Scrie-ne orice întrebare!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} ref={el => { if (el) messageRefs.current.set(msg.id, el); else messageRefs.current.delete(msg.id) }}>
            <MessageBubble
              msg={msg}
              isOwn={msg.sender_id === userId}
              userId={userId}
              isHighlighted={searchResultIds.length > 0 && searchResultIds[searchIdx] === msg.id}
              onReact={handleReact}
              onEdit={handleEdit}
              onReply={setReplyTo}
              onScrollToMessage={scrollToMessage}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}<button onClick={() => setError(null)} className="ml-2 underline text-xs">ok</button>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-start gap-2 bg-brand-50 border-l-4 border-brand-400 mx-4 rounded-lg px-3 py-1.5 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-700">Răspuns la</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none flex-shrink-0">×</button>
        </div>
      )}

      <form onSubmit={handleSend} className="border-t border-gray-100 bg-white px-4 py-3 flex gap-2 items-end flex-shrink-0">
        <button
          type="button"
          onClick={() => setSearchOpen(o => !o)}
          className="text-gray-400 hover:text-gray-600 text-sm flex-shrink-0 pb-1"
          title="Caută în mesaje"
        >
          🔍
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 96) + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          style={{ minHeight: '36px', maxHeight: '96px' }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="bg-brand-600 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </form>
    </div>
  )
}
