'use client'
import type { ChatMessage } from '@/lib/types'

interface Props {
  message: ChatMessage
  isOwn: boolean
  isAdmin: boolean
  onAdminAction: (id: string, action: 'pin' | 'announce' | 'delete') => void
}

export default function ChatMessageBubble({ message, isOwn, isAdmin, onAdminAction }: Props) {
  const { sender, body, image_url, is_announcement, is_pinned, created_at } = message
  const isAdminSender = sender.role === 'admin'
  const time = new Date(created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

  if (is_announcement) {
    return (
      <div className="w-full px-4 py-1 group">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600 font-semibold mb-1">📣 Anunț de la echipă</p>
          {body && <p className="text-sm text-gray-800 whitespace-pre-wrap">{body}</p>}
          {image_url && (
            <a href={image_url} target="_blank" rel="noopener noreferrer">
              <img src={image_url} alt="imagine" className="mt-2 max-h-60 rounded-lg mx-auto cursor-pointer" loading="lazy" />
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">{time} · {sender.name || sender.email}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 justify-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAdminAction(message.id, 'delete')}
              className="text-base hover:scale-110 transition-transform"
              title="Șterge mesajul"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-4 py-0.5 group`}>
      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className={`text-xs font-semibold px-1 ${isAdminSender ? 'text-amber-700' : 'text-brand-700'}`}>
            {sender.name || sender.email}
          </span>
        )}

        <div className={`relative rounded-2xl px-3 py-2 ${
          isOwn
            ? 'bg-brand-600 text-white rounded-br-sm'
            : isAdminSender
              ? 'bg-amber-50 text-gray-900 border border-amber-200 rounded-bl-sm'
              : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
        }`}>
          {is_pinned && (
            <span className={`text-xs block mb-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>📌 fixat</span>
          )}
          {body && <p className="text-sm whitespace-pre-wrap break-words">{body}</p>}
          {image_url && (
            <a href={image_url} target="_blank" rel="noopener noreferrer">
              <img
                src={image_url}
                alt="imagine"
                className="mt-1 max-h-60 max-w-full rounded-lg cursor-pointer"
                loading="lazy"
              />
            </a>
          )}
          <span className={`text-xs block text-right mt-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>
            {time}
          </span>
        </div>

        {isAdmin && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onAdminAction(message.id, 'pin')}
              className="text-base hover:scale-110 transition-transform"
              title={is_pinned ? 'Dezfixează' : 'Fixează'}
            >
              {is_pinned ? '📌' : '📍'}
            </button>
            <button
              onClick={() => onAdminAction(message.id, 'announce')}
              className="text-base hover:scale-110 transition-transform"
              title="Marchează ca anunț"
            >
              📣
            </button>
            <button
              onClick={() => onAdminAction(message.id, 'delete')}
              className="text-base hover:scale-110 transition-transform"
              title="Șterge mesajul"
            >
              🗑️
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
