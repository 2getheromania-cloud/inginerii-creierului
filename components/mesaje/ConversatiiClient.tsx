'use client'
import { useState } from 'react'
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

function UserButton({
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
      className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
        isSelected
          ? 'bg-brand-50 border border-brand-200'
          : 'bg-white border border-gray-100 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gray-900 truncate flex-1">{u.name}</p>
        {u.role === 'admin' && (
          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
            Admin
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 truncate">{u.email}</p>
    </button>
  )
}

export default function ConversatiiClient({ users, currentUserId, currentUserRole }: Props) {
  const [selected, setSelected] = useState<UserItem | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()
  const filtered = users.filter(
    u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )

  const admins = filtered.filter(u => u.role === 'admin')
  const cursanti = filtered.filter(u => u.role === 'cursant')
  const showGroups = currentUserRole === 'admin'

  async function handleSelect(u: UserItem) {
    setSelected(u)
    setConversationId(null)
    setLoading(true)
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherUserId: u.id }),
      })
      const data = await res.json()
      if (data.id) setConversationId(data.id)
    } finally {
      setLoading(false)
    }
  }

  if (users.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        {currentUserRole === 'admin' ? 'Niciun utilizator disponibil.' : 'Niciun admin disponibil.'}
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      {/* Left panel */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Caută..."
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <div className="flex-1 overflow-y-auto flex flex-col gap-1">
          {showGroups ? (
            <>
              {admins.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mt-1 mb-0.5">
                    Admini
                  </p>
                  {admins.map(u => (
                    <UserButton
                      key={u.id}
                      u={u}
                      isSelected={selected?.id === u.id}
                      onClick={() => handleSelect(u)}
                    />
                  ))}
                </>
              )}
              {cursanti.length > 0 && (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mt-3 mb-0.5">
                    Cursanți
                  </p>
                  {cursanti.map(u => (
                    <UserButton
                      key={u.id}
                      u={u}
                      isSelected={selected?.id === u.id}
                      onClick={() => handleSelect(u)}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            filtered.map(u => (
              <UserButton
                key={u.id}
                u={u}
                isSelected={selected?.id === u.id}
                onClick={() => handleSelect(u)}
              />
            ))
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Niciun rezultat</p>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 card p-0 flex flex-col overflow-hidden">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Se încarcă...
          </div>
        )}
        {!loading && selected && conversationId && (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0 flex items-center gap-2">
              <p className="font-semibold text-gray-900">{selected.name}</p>
              {selected.role === 'admin' && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
                  Admin
                </span>
              )}
              <p className="text-xs text-gray-400 ml-1">{selected.email}</p>
            </div>
            <AdminPrivateChatClient
              key={conversationId}
              conversationId={conversationId}
              currentUserId={currentUserId}
            />
          </>
        )}
        {!loading && !selected && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm px-8 text-center">
            {currentUserRole === 'admin'
              ? 'Selectează un utilizator din stânga pentru a deschide conversația.'
              : 'Selectează un admin pentru a trimite un mesaj.'}
          </div>
        )}
      </div>
    </div>
  )
}
