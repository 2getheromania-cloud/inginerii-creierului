'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrivateMessage } from '@/lib/types'

interface Props {
  conversationId: string
  currentUserId: string
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
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }

  function markRead() {
    fetch(`/api/conversations/${conversationId}/messages`, { method: 'PATCH' }).catch(() => {})
  }

  useEffect(() => {
    markRead()
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then((data: PrivateMessage[]) => {
        setMessages(data)
        // Instant jump on initial load
        setTimeout(() => scrollToBottom(false), 50)
      })

    const channel = supabase
      .channel(`admin-conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as PrivateMessage
        setMessages(prev => {
          // Remove any matching optimistic placeholder before adding the real message
          const withoutOptimistic = prev.filter(m =>
            !(m.id.startsWith('tmp-') && m.sender_id === incoming.sender_id && m.content === incoming.content)
          )
          return [...withoutOptimistic, incoming]
        })
        setTimeout(() => scrollToBottom(true), 50)
        markRead()
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

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError(null)

    // Optimistic message shown immediately
    const optimistic: PrivateMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: trimmed,
      read: false,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    setTimeout(() => scrollToBottom(true), 30)

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
    setSending(false)

    if (!res.ok) {
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setText(trimmed)
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la trimitere')
    }
    // On success, realtime will add the real message (duplicate is fine — realtime deduplication via id)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        style={{ overscrollBehavior: 'contain' }}
      >
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">Niciun mesaj încă.</p>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === currentUserId
          const time = new Date(msg.created_at).toLocaleTimeString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const isOptimistic = msg.id.startsWith('tmp-')
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[80%] md:max-w-[72%] rounded-2xl px-4 py-2.5
                ${isOwn
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-900 rounded-bl-sm'}
                ${isOptimistic ? 'opacity-70' : ''}
              `}>
                <p className="text-[15px] md:text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {msg.content}
                </p>
                <p
                  className={`text-[11px] mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}
                  suppressHydrationWarning
                >
                  {time}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100 flex items-center gap-2">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="underline text-xs flex-shrink-0">ok</button>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 bg-white px-3 py-3 flex gap-2 items-end flex-shrink-0"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => { setText(e.target.value); autoResize() }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(e as unknown as React.FormEvent)
            }
          }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-[15px] md:text-sm leading-snug focus:outline-none focus:ring-2 focus:ring-brand-400 bg-gray-50 focus:bg-white transition-colors"
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-brand-600 text-white rounded-full w-11 h-11 md:w-9 md:h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 md:w-4 md:h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
