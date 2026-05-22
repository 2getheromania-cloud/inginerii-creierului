'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { linkifyText } from '@/lib/linkify'
import type { PrivateMessage, ChatReaction } from '@/lib/types'

const QUICK_EMOJIS = ['😊', '❤️', '🙏', '🌿', '💪', '🔥', '👏']
const REACTION_EMOJIS = ['❤️', '🙏', '😊', '🔥', '👏', '💪', '🌿']

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
  msg, isOwn, currentUserId, isHighlighted, onReact, onEdit, onDelete, onReply, onScrollToMessage,
}: {
  msg: PrivateMessage
  isOwn: boolean
  currentUserId: string
  isHighlighted?: boolean
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, content: string) => Promise<void>
  onDelete: (id: string) => void
  onReply: (msg: PrivateMessage) => void
  onScrollToMessage: (id: string) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(msg.content)
  const [saving, setSaving] = useState(false)
  const time = new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  const reactionGroups = groupReactions(msg.reactions, currentUserId)
  const isOptimistic = msg.id.startsWith('tmp-')
  const replyContent = msg.reply_to?.content || 'Mesaj original indisponibil'

  async function saveEdit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === msg.content) { setIsEditing(false); return }
    setSaving(true)
    await onEdit(msg.id, trimmed)
    setSaving(false)
    setIsEditing(false)
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[80%] md:max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Bubble */}
        {isEditing ? (
          <div className="bg-white border-2 border-brand-400 rounded-2xl px-4 py-2.5 min-w-[160px]">
            <textarea autoFocus value={draft}
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
          <div className={`rounded-2xl px-4 py-2.5 transition-colors ${
            isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          } ${isOptimistic ? 'opacity-70' : ''} ${isHighlighted ? 'ring-2 ring-brand-400' : ''}`}>
            {msg.reply_to_id && (
              <button
                type="button"
                onClick={() => onScrollToMessage(msg.reply_to?.id ?? msg.reply_to_id!)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  marginBottom: 6, borderRadius: 8, padding: '5px 8px',
                  border: 'none', cursor: 'pointer', overflow: 'hidden',
                  WebkitTapHighlightColor: 'transparent',
                  ...(isOwn
                    ? { background: 'rgba(0,0,0,0.15)', borderLeft: '3px solid rgba(255,255,255,0.35)' }
                    : { background: 'rgba(0,0,0,0.04)', borderLeft: '3px solid #22c55e' }
                  ),
                }}
              >
                <p style={{
                  fontSize: 14, fontWeight: 600, marginBottom: 2, lineHeight: 1.3,
                  color: isOwn ? 'rgba(255,255,255,0.9)' : '#16a34a',
                }}>
                  Răspuns la
                </p>
                <p style={{
                  fontSize: 14, lineHeight: 1.35, margin: 0,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  color: isOwn ? 'rgba(255,255,255,0.65)' : '#6b7280',
                } as React.CSSProperties}>
                  {replyContent}
                </p>
              </button>
            )}
            <p className="text-[19px] md:text-lg whitespace-pre-wrap break-words leading-relaxed">
              {linkifyText(msg.content, isOwn
                ? 'underline break-all opacity-80 hover:opacity-100 text-white'
                : 'underline break-all opacity-80 hover:opacity-100 text-gray-700')}
            </p>
            <p className={`text-sm mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>
              {time}{msg.edited_at ? ' · editat' : ''}
            </p>
          </div>
        )}

        {/* Reaction badges */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1 mt-0.5">
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

        {/* Action bar — inline styles, always visible, no hover/breakpoint dependency */}
        {!isOptimistic && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
            <button type="button" onClick={() => setShowPicker(p => !p)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: '#f3f4f6', color: '#374151', fontSize: 17, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              <span>😊</span><span>Reacție</span>
            </button>
            <button type="button" onClick={() => onReply(msg)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: '#f3f4f6', color: '#374151', fontSize: 17, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              <span>↩️</span><span>Răspunde</span>
            </button>
            {isOwn && !isEditing && !isOptimistic && (
              <button type="button" onClick={() => { setIsEditing(true); setDraft(msg.content) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: '#f3f4f6', color: '#374151', fontSize: 17, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                <span>✏️</span><span>Editează</span>
              </button>
            )}
            {isOwn && !isOptimistic && (
              <button type="button" onClick={() => onDelete(msg.id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: '#fee2e2', color: '#b91c1c', fontSize: 17, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                <span>🗑️</span><span>Șterge</span>
              </button>
            )}
          </div>
        )}

        {/* Emoji picker — fixed bottom sheet, no sm:hidden, works on all screens */}
        {showPicker && (
          <>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }} onClick={() => setShowPicker(false)} />
            <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,0.18)', padding: '12px 24px 32px' }}>
              <div style={{ width: 40, height: 4, background: '#e5e7eb', borderRadius: 2, margin: '0 auto 16px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
                {REACTION_EMOJIS.map(e => (
                  <button key={e} onClick={() => { onReact(msg.id, e); setShowPicker(false) }}
                    style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  >{e}</button>
                ))}
              </div>
              <button onClick={() => setShowPicker(false)}
                style={{ width: '100%', padding: '12px 0', fontSize: 13, color: '#9ca3af', background: 'transparent', border: 'none', borderTop: '1px solid #f3f4f6', cursor: 'pointer' }}>
                Anulează
              </button>
            </div>
          </>
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
      .then(async r => {
        if (!r.ok) return
        const data: PrivateMessage[] = await r.json()
        setMessages(prev => {
          const byId = new Map(data.map(m => [m.id, m]))
          for (const m of prev) if (!byId.has(m.id)) byId.set(m.id, m)
          return Array.from(byId.values()).sort((a, b) => a.created_at < b.created_at ? -1 : 1)
        })
        setTimeout(() => scrollToBottom(false), 50)
      })
      .catch(() => {})

    const channel = supabase
      .channel(`admin-conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as PrivateMessage
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev
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
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, content: updated.content } : m))
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

  const handleDelete = useCallback(async (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId))
    const res = await fetch(`/api/private-messages/${msgId}`, { method: 'DELETE' })
    if (!res.ok) {
      fetch(`/api/conversations/${conversationId}/messages`)
        .then(async r => { if (r.ok) { const data = await r.json(); setMessages(data) } })
        .catch(() => {})
    }
  }, [conversationId])

  const handleEdit = useCallback(async (msgId: string, content: string) => {
    const res = await fetch(`/api/private-messages/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const saved = await res.json().catch(() => null)
      const savedContent = saved?.content ?? content
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: savedContent } : m))
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
      body: JSON.stringify({ content: trimmed, reply_to_id: capturedReplyToId }),
    })
    setSending(false)
    if (!res.ok) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la trimitere')
    } else {
      const saved = await res.json().catch(() => null)
      if (saved?.id) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, id: saved.id } : m))
      }
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Search bar */}
      {searchOpen && (
        <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-gray-100 flex-shrink-0">
          <input autoFocus type="text" value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchIdx(0) }}
            placeholder="Caută în mesaje..."
            className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          {searchResultIds.length > 0 && (
            <span className="text-xs text-gray-500 whitespace-nowrap">{searchIdx + 1}/{searchResultIds.length}</span>
          )}
          <button type="button" onClick={() => setSearchIdx(i => Math.max(0, i - 1))}
            disabled={searchResultIds.length === 0 || searchIdx === 0}
            className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 rounded-full hover:bg-gray-100">▲</button>
          <button type="button" onClick={() => setSearchIdx(i => Math.min(searchResultIds.length - 1, i + 1))}
            disabled={searchResultIds.length === 0 || searchIdx === searchResultIds.length - 1}
            className="w-8 h-8 flex items-center justify-center text-gray-500 disabled:opacity-30 rounded-full hover:bg-gray-100">▼</button>
          <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchIdx(0) }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 text-lg">×</button>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2" style={{ overscrollBehavior: 'contain' }}>
        {messages.length === 0 && <p className="text-center text-gray-400 text-sm py-12">Niciun mesaj încă.</p>}
        {messages.map(msg => (
          <div key={msg.id} ref={el => { if (el) messageRefs.current.set(msg.id, el); else messageRefs.current.delete(msg.id) }}>
            <MessageBubble
              msg={msg}
              isOwn={msg.sender_id === currentUserId}
              currentUserId={currentUserId}
              isHighlighted={searchResultIds.length > 0 && searchResultIds[searchIdx] === msg.id}
              onReact={handleReact}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReply={setReplyTo}
              onScrollToMessage={scrollToMessage}
            />
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs flex-shrink-0">ok</button>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-start gap-2 bg-brand-50 border-l-4 border-brand-400 mx-3 rounded-lg px-3 py-1.5 mb-1 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-700">Răspuns la</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center flex-shrink-0">×</button>
        </div>
      )}

      {/* Quick emojis + search */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 bg-white border-t border-gray-100 flex-shrink-0">
        <button type="button" onClick={() => setSearchOpen(o => !o)}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0"
          title="Caută în mesaje">🔍</button>
        <div className="flex-1 flex justify-end gap-0.5">
          {QUICK_EMOJIS.map(emoji => (
            <button key={emoji} type="button" onClick={() => setText(prev => prev + emoji)}
              className="w-9 h-9 flex items-center justify-center text-xl leading-none hover:scale-125 active:scale-110 transition-transform" aria-label={emoji}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSend} className="bg-white px-3 pb-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize() }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[19px] md:text-lg leading-snug focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white transition-colors"
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
