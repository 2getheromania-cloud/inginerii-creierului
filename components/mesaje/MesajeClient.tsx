'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { linkifyText, isImageUrl } from '@/lib/linkify'
import type { PrivateMessage, ChatReaction } from '@/lib/types'

const REACTION_EMOJIS = ['❤️', '👍', '😊', '😂', '😮', '🙏', '🔥', '👏', '💪', '🌿']

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
  msg, isOwn, userId, isHighlighted, onReact, onEdit, onDelete, onReply, onScrollToMessage,
}: {
  msg: PrivateMessage
  isOwn: boolean
  userId: string
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
  const reactionGroups = groupReactions(msg.reactions, userId)
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
      <div className={`flex flex-col max-w-[80%] ${isOwn ? 'items-end' : 'items-start'}`}>

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
          <div className={`max-w-full rounded-2xl px-4 py-2.5 transition-colors ${
            isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white shadow-sm text-gray-900 rounded-bl-sm'
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
            {isImageUrl(msg.content) ? (
              <a href={msg.content} target="_blank" rel="noopener noreferrer">
                <img src={msg.content} alt="Imagine" className="max-w-full rounded-xl max-h-72 object-contain" />
              </a>
            ) : (
              <p className="text-[19px] md:text-lg whitespace-pre-wrap break-words leading-relaxed">
                {linkifyText(msg.content, isOwn
                  ? 'underline break-all opacity-80 hover:opacity-100 text-white'
                  : 'underline break-all opacity-80 hover:opacity-100 text-gray-700')}
              </p>
            )}
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
            {isOwn && !isEditing && (
              <button type="button" onClick={() => { setIsEditing(true); setDraft(msg.content) }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, background: '#f3f4f6', color: '#374151', fontSize: 17, fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                <span>✏️</span><span>Editează</span>
              </button>
            )}
            {isOwn && (
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

export default function MesajeClient({ conversationId, userId }: Props) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<PrivateMessage | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIdx, setSearchIdx] = useState(0)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
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

  const fetchMessages = useCallback(async () => {
    const r = await fetch(`/api/conversations/${conversationId}/messages`).catch(() => null)
    if (!r?.ok) return
    const data: PrivateMessage[] = await r.json()
    setMessages(prev => {
      const prevMap = new Map(prev.map(m => [m.id, m]))
      const byId = new Map<string, PrivateMessage>(data.map(m => [m.id, {
        ...m,
        reactions: prevMap.get(m.id)?.reactions ?? m.reactions ?? [],
      } as PrivateMessage]))
      for (const m of prev) if (!byId.has(m.id)) byId.set(m.id, m)
      return Array.from(byId.values()).sort((a, b) => a.created_at < b.created_at ? -1 : 1)
    })
  }, [conversationId])

  useEffect(() => {
    markRead()
    fetchMessages().then(() => setTimeout(scrollToBottom, 50))

    const pollId = setInterval(fetchMessages, 15_000)


    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as PrivateMessage
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev
          return [...prev, incoming]
        })
        setTimeout(scrollToBottom, 50)
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

    return () => { supabase.removeChannel(channel); clearInterval(pollId) }
  }, [conversationId, fetchMessages])

  const handleReact = useCallback(async (msgId: string, emoji: string) => {
    const applyToggle = (msgs: PrivateMessage[]) => msgs.map(m => {
      if (m.id !== msgId) return m
      const reactions = m.reactions ?? []
      const idx = reactions.findIndex(r => r.emoji === emoji && r.user_id === userId)
      return { ...m, reactions: idx >= 0 ? reactions.filter((_, i) => i !== idx) : [...reactions, { emoji, user_id: userId }] }
    })
    setMessages(prev => applyToggle(prev))
    const res = await fetch('/api/private-reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: msgId, emoji }),
    }).catch(() => null)
    if (!res || !res.ok) setMessages(prev => applyToggle(prev))
  }, [userId])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!imageInputRef.current) return
    imageInputRef.current.value = ''
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/chat-images', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Eroare la upload.'); return }
      const msgRes = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.url }),
      })
      if (!msgRes.ok) {
        const d = await msgRes.json().catch(() => ({}))
        setError(d.error ?? 'Eroare la trimitere.')
      }
    } finally {
      setUploading(false)
    }
  }

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
              onDelete={handleDelete}
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
        <div className="flex items-start gap-2 bg-brand-50 border-l-4 border-brand-400 mx-4 rounded-lg px-3 py-1.5 mb-1 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-700">Răspuns la</p>
            <p className="text-xs text-gray-500 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none flex-shrink-0 w-8 h-8 flex items-center justify-center">×</button>
        </div>
      )}

      <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleImageUpload} />
      <form onSubmit={handleSend} className="border-t border-gray-100 bg-white px-3 py-3 flex gap-2 items-end flex-shrink-0">
        <button type="button" onClick={() => setSearchOpen(o => !o)}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0"
          title="Caută în mesaje">🔍</button>
        <button type="button" onClick={() => imageInputRef.current?.click()} disabled={uploading}
          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 active:bg-gray-100 transition-colors flex-shrink-0 disabled:opacity-40"
          title="Trimite imagine">📎</button>
        {uploading && <span className="text-xs text-gray-400 self-center">Se trimite...</span>}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); const el = e.target; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 96) + 'px' }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent) } }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2.5 text-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          style={{ minHeight: '40px', maxHeight: '96px' }}
        />
        <button type="submit" disabled={!text.trim() || sending}
          className="bg-brand-600 text-white rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 active:scale-95 transition-all">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
        </button>
      </form>
    </div>
  )
}
