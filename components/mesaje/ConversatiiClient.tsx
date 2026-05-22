'use client'
import { useState, useEffect, useRef } from 'react'
import AdminPrivateChatClient from '@/components/admin/AdminPrivateChatClient'

interface UserItem {
  id: string
  name: string
  email: string
  role: 'admin' | 'cursant'
}

interface Props {
  users: UserItem[]
  currentUserId: string
  currentUserRole: 'admin' | 'cursant'
}

function Avatar({ name, role }: { name: string; role: string }) {
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm ${
      role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-brand-100 text-brand-700'
    }`}>
      {(name[0] ?? '?').toUpperCase()}
    </div>
  )
}

function UserRow({
  u,
  isSelected,
  onClick,
}: {
  u: UserItem
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl transition-colors flex items-center gap-3 ${
        isSelected
          ? 'bg-brand-50 border border-brand-200'
          : 'bg-white border border-gray-100 active:bg-gray-50 hover:bg-gray-50'
      }`}
    >
      <Avatar name={u.name} role={u.role} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
          {u.role === 'admin' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0 hidden sm:inline">
              Admin
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{u.email}</p>
      </div>
      {/* Chevron hint on mobile */}
      <svg className="w-4 h-4 text-gray-300 flex-shrink-0 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

export default function ConversatiiClient({ users, currentUserId, currentUserRole }: Props) {
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const autoOpenDone = useRef(false)


  const q = search.toLowerCase()
  const filtered = users.filter(
    u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
  const admins = filtered.filter(u => u.role === 'admin')
  const cursanti = filtered.filter(u => u.role === 'cursant')
  const showGroups = currentUserRole === 'admin'

  async function handleSelect(u: UserItem) {
    console.log('[CHAT] handleSelect called for user:', u.id, u.name)
    setSelected(u)
    setConversationId(null)
    setLoading(true)
    setMobileView('chat')
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: u.id }),
      })
      const data = await res.json()
      if (data.id) setConversationId(data.id)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  // Auto-open: on mount, open the last-opened user (localStorage) or the only user in the list.
  // This ensures the cursant sees the conversation immediately when navigating to /mesaje.
  useEffect(() => {
    if (autoOpenDone.current || users.length === 0) return

    const lastId = (() => {
      try { return localStorage.getItem('lastPrivateChatUserId') } catch { return null }
    })()

    const target = (lastId ? users.find(u => u.id === lastId) : null) ?? (users.length === 1 ? users[0] : null)
    if (target) {
      autoOpenDone.current = true
      handleSelect(target)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist last-opened user so we can auto-open on next visit
  function selectAndRemember(u: UserItem) {
    try { localStorage.setItem('lastPrivateChatUserId', u.id) } catch {}
    handleSelect(u)
  }

  if (users.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        {currentUserRole === 'admin' ? 'Niciun utilizator disponibil.' : 'Niciun admin disponibil.'}
      </div>
    )
  }

  return (
    // Desktop: fixed-height flex row  |  Mobile: block (natural flow for list, fixed overlay for chat)
    <div className="md:flex md:gap-4 md:h-[calc(100vh-12rem)]">

      {/* ── List panel ──────────────────────────────────────────────────── */}
      <div className={`flex flex-col gap-2 md:w-64 md:flex-shrink-0 ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută după nume sau email..."
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        />

        <div className="flex flex-col gap-1 md:flex-1 md:overflow-y-auto">
          {showGroups ? (
            <>
              {admins.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-1 pb-0.5">
                    Admini
                  </p>
                  {admins.map(u => (
                    <UserRow key={u.id} u={u} isSelected={selected?.id === u.id} onClick={() => selectAndRemember(u)} />
                  ))}
                </>
              )}
              {cursanti.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pt-3 pb-0.5">
                    Cursanți
                  </p>
                  {cursanti.map(u => (
                    <UserRow key={u.id} u={u} isSelected={selected?.id === u.id} onClick={() => selectAndRemember(u)} />
                  ))}
                </>
              )}
            </>
          ) : (
            filtered.map(u => (
              <UserRow key={u.id} u={u} isSelected={selected?.id === u.id} onClick={() => selectAndRemember(u)} />
            ))
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Niciun rezultat</p>
          )}
        </div>
      </div>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {/*
        Mobile chat: fixed full-screen overlay covering navbar (z-50)
        Mobile list: hidden
        Desktop: always shown as flex-1
      */}
      <div className={
        mobileView === 'list'
          ? 'hidden md:flex md:flex-col md:flex-1 md:rounded-2xl md:border md:border-gray-100 md:bg-white md:shadow-sm md:overflow-hidden'
          : 'fixed inset-0 z-50 flex flex-col bg-white md:relative md:inset-auto md:z-auto md:flex-1 md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:overflow-hidden'
      }>

        {/* Sticky header */}
        {selected ? (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0 bg-white">
            {/* Back button — mobile only */}
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden -ml-1 p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
              aria-label="Înapoi"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <Avatar name={selected.name} role={selected.role} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
                {selected.role === 'admin' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate hidden sm:block">{selected.email}</p>
            </div>
          </div>
        ) : null}

        {/* Body */}
        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Se încarcă conversația...
          </div>
        )}

        {!loading && selected && conversationId && (
          <AdminPrivateChatClient
            key={conversationId}
            conversationId={conversationId}
            currentUserId={currentUserId}
          />
        )}

        {!loading && !selected && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 px-8 text-center">
            <svg className="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">
              {currentUserRole === 'admin'
                ? 'Selectează un utilizator pentru a deschide conversația.'
                : 'Selectează un admin pentru a trimite un mesaj.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
