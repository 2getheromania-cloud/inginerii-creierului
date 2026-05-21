'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PrivateMessage } from '@/lib/types'

interface Props {
  conversationId: string
  userId: string
  userName: string
}

export default function MesajeClient({ conversationId, userId, userName }: Props) {
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  function scrollToBottom() {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }

  useEffect(() => {
    fetch(`/api/conversations/${conversationId}/messages`)
      .then(r => r.json())
      .then((data: PrivateMessage[]) => {
        setMessages(data)
        setTimeout(scrollToBottom, 50)
      })

    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'private_messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as PrivateMessage])
        setTimeout(scrollToBottom, 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError(null)
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: trimmed }),
    })
    setSending(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error ?? 'Eroare la trimitere')
      return
    }
    setText('')
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-12">
            Niciun mesaj încă. Scrie-ne orice întrebare!
          </p>
        )}
        {messages.map(msg => {
          const isOwn = msg.sender_id === userId
          const time = new Date(msg.created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isOwn ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white shadow-sm text-gray-900 rounded-bl-sm'
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-xs mt-1 text-right ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>{time}</p>
              </div>
            </div>
          )
        })}
      </div>
      {error && (
        <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">ok</button>
        </div>
      )}
      <form onSubmit={handleSend} className="border-t border-gray-100 bg-white px-4 py-3 flex gap-2 items-end flex-shrink-0">
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); const el = e.target; el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,96)+'px' }}
          onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSend(e as unknown as React.FormEvent)} }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          style={{ minHeight:'36px', maxHeight:'96px' }}
        />
        <button type="submit" disabled={!text.trim()||sending}
          className="bg-brand-600 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </form>
    </div>
  )
}
