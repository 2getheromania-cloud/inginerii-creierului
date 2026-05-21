'use client'
import { useState, useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/types'
import ChatMessageBubble from './ChatMessage'
import ChatInput from './ChatInput'

const POLL_MS = 8000

interface Props {
  initialMessages: ChatMessage[]
  userId: string
  userRole: 'cursant' | 'admin'
}

function sortedValues(map: Map<string, ChatMessage>): ChatMessage[] {
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
}

export default function ChatClient({ initialMessages, userId, userRole }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [sending, setSending] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(initialMessages.length >= 60)
  const [sendError, setSendError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const latestTsRef = useRef<string>(
    initialMessages.at(-1)?.created_at ?? new Date(0).toISOString()
  )
  const isAtBottomRef = useRef(true)

  function scrollToBottom(force = false) {
    const el = scrollRef.current
    if (!el) return
    if (force || isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom(true)
  }, [])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120
  }

  // 8-second polling for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/messages?since=${encodeURIComponent(latestTsRef.current)}`)
        if (!res.ok) return
        const newMsgs: ChatMessage[] = await res.json()
        if (newMsgs.length === 0) return
        setMessages(prev => {
          const map = new Map(prev.map(m => [m.id, m]))
          newMsgs.forEach(m => map.set(m.id, m))
          return sortedValues(map)
        })
        latestTsRef.current = newMsgs.at(-1)!.created_at
        setTimeout(() => scrollToBottom(), 50)
      } catch {}
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  async function loadOlder() {
    if (loadingOlder || messages.length === 0) return
    setLoadingOlder(true)
    const oldestTs = messages[0].created_at
    const el = scrollRef.current
    const prevScrollHeight = el?.scrollHeight ?? 0
    try {
      const res = await fetch(`/api/chat/messages?before=${encodeURIComponent(oldestTs)}`)
      if (!res.ok) return
      const older: ChatMessage[] = await res.json()
      if (older.length < 60) setHasOlder(false)
      if (older.length === 0) return
      setMessages(prev => {
        const map = new Map(prev.map(m => [m.id, m]))
        older.forEach(m => map.set(m.id, m))
        return sortedValues(map)
      })
      setTimeout(() => {
        if (el) el.scrollTop = el.scrollHeight - prevScrollHeight
      }, 50)
    } finally {
      setLoadingOlder(false)
    }
  }

  async function handleSend(body: string | null, imageUrl: string | null, imagePath: string | null) {
    setSending(true)
    setSendError(null)
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, image_url: imageUrl, image_path: imagePath }),
      })
      const data = await res.json()
      if (!res.ok) { setSendError(data.error ?? 'Eroare la trimitere'); return }
      const msg = data as ChatMessage
      setMessages(prev => {
        const map = new Map(prev.map(m => [m.id, m]))
        map.set(msg.id, msg)
        return sortedValues(map)
      })
      latestTsRef.current = msg.created_at
      setTimeout(() => scrollToBottom(true), 50)
    } finally {
      setSending(false)
    }
  }

  async function handleReact(id: string, emoji: string) {
    // Optimistic toggle
    setMessages(prev => prev.map(m => {
      if (m.id !== id) return m
      const reactions = m.reactions ?? []
      const idx = reactions.findIndex(r => r.emoji === emoji && r.user_id === userId)
      return {
        ...m,
        reactions: idx >= 0
          ? reactions.filter((_, i) => i !== idx)
          : [...reactions, { emoji, user_id: userId }],
      }
    }))
    fetch('/api/chat/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id: id, emoji }),
    }).catch(() => {})
  }

  async function handleEdit(id: string, newBody: string) {
    const res = await fetch(`/api/chat/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newBody }),
    })
    if (res.ok) {
      setMessages(prev => prev.map(m =>
        m.id === id ? { ...m, body: newBody, edited_at: new Date().toISOString() } : m
      ))
    }
  }

  async function handleAdminAction(id: string, action: 'pin' | 'announce' | 'delete') {
    if (action === 'delete') {
      setConfirmDeleteId(id)
      return
    }
    const msg = messages.find(m => m.id === id)
    if (!msg) return
    setActionError(null)
    const payload: Record<string, unknown> = {}
    if (action === 'pin')      payload.is_pinned       = !msg.is_pinned
    if (action === 'announce') payload.is_announcement = !msg.is_announcement

    const res = await fetch(`/api/chat/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setActionError(data.error ?? 'Eroare la actualizarea mesajului.')
      return
    }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...payload } as ChatMessage : m))
  }

  async function confirmDelete(id: string) {
    setConfirmDeleteId(null)
    setActionError(null)
    const res = await fetch(`/api/chat/messages/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setActionError(data.error ?? 'Eroare la ștergerea mesajului.')
      return
    }
    setMessages(prev => prev.filter(m => m.id !== id))
  }

  const isAdmin = userRole === 'admin'
  const pinnedMessages = messages.filter(m => m.is_pinned && !m.is_announcement)

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-brand-50 border-b border-brand-100 px-4 py-2 flex-shrink-0">
          <div className="flex items-start gap-2">
            <span className="text-sm">📌</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-700 mb-0.5">
                {pinnedMessages.length > 1 ? `${pinnedMessages.length} mesaje fixate` : 'Mesaj fixat'}
              </p>
              <p className="text-xs text-brand-600 truncate">
                {pinnedMessages.at(-1)?.body ?? '(imagine)'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3 space-y-0.5"
      >
        {hasOlder && (
          <div className="text-center py-2">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="text-sm text-brand-600 hover:underline disabled:opacity-50"
            >
              {loadingOlder ? 'Se încarcă...' : '↑ Mesaje mai vechi'}
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-16 text-sm">
            Niciun mesaj încă. Fii primul care scrie! 🌿
          </div>
        )}

        {messages.map(msg => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === userId}
            isAdmin={isAdmin}
            currentUserId={userId}
            onAdminAction={handleAdminAction}
            onReact={handleReact}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {/* Action error */}
      {actionError && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100 flex-shrink-0">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 underline text-xs">ok</button>
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100 flex-shrink-0">
          {sendError}
          <button onClick={() => setSendError(null)} className="ml-2 underline text-xs">ok</button>
        </div>
      )}

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 mx-4 max-w-sm w-full">
            <p className="text-gray-800 font-semibold text-base mb-1">Ștergi mesajul?</p>
            <p className="text-gray-500 text-sm mb-5">Această acțiune este ireversibilă.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Anulează
              </button>
              <button
                onClick={() => confirmDelete(confirmDeleteId)}
                className="px-4 py-2 text-sm rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatInput userId={userId} onSend={handleSend} sending={sending} />
    </div>
  )
}
