'use client'
import { useState } from 'react'
import AdminPrivateChatClient from '@/components/admin/AdminPrivateChatClient'

interface Conversation {
  id: string
  userId: string
  name: string
  email: string
}

interface Props {
  conversations: Conversation[]
  adminId: string
}

export default function AdminConversatiiClient({ conversations, adminId }: Props) {
  const [selected, setSelected] = useState<Conversation | null>(
    conversations.length > 0 ? conversations[0] : null
  )

  if (conversations.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        Niciun cursant nu a deschis încă o conversație.
      </div>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-12rem)]">
      <div className="w-64 flex-shrink-0 flex flex-col gap-1 overflow-y-auto">
        {conversations.map(conv => (
          <button
            key={conv.id}
            onClick={() => setSelected(conv)}
            className={`text-left px-4 py-3 rounded-xl transition-colors ${
              selected?.id === conv.id
                ? 'bg-brand-50 border border-brand-200'
                : 'bg-white border border-gray-100 hover:bg-gray-50'
            }`}
          >
            <p className="text-sm font-medium text-gray-900 truncate">{conv.name}</p>
            <p className="text-xs text-gray-400 truncate">{conv.email}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 card p-0 flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="font-semibold text-gray-900">{selected.name}</p>
              <p className="text-xs text-gray-400">{selected.email}</p>
            </div>
            <AdminPrivateChatClient
              key={selected.id}
              conversationId={selected.id}
              adminId={adminId}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Selectează o conversație
          </div>
        )}
      </div>
    </div>
  )
}
