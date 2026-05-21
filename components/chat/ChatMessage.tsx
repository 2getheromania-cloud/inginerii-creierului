'use client'
import { useState, useRef, useEffect } from 'react'
import type { ChatMessage, ChatReaction } from '@/lib/types'
import { linkifyText } from '@/lib/linkify'

const REACTION_EMOJIS = ['❤️', '👍', '😂', '🥲', '🙏', '💪']

interface Props {
  message: ChatMessage
  isOwn: boolean
  isAdmin: boolean
  currentUserId: string
  isHighlighted?: boolean
  onAdminAction: (id: string, action: 'pin' | 'announce' | 'delete') => void
  onReact: (id: string, emoji: string) => void
  onEdit: (id: string, newBody: string) => Promise<void>
  onReply: (msg: ChatMessage) => void
  onScrollToMessage: (id: string) => void
}

function groupReactions(reactions: ChatReaction[], currentUserId: string) {
  const map = new Map<string, { count: number; mine: boolean }>()
  for (const r of reactions) {
    const prev = map.get(r.emoji) ?? { count: 0, mine: false }
    map.set(r.emoji, { count: prev.count + 1, mine: prev.mine || r.user_id === currentUserId })
  }
  return Array.from(map.entries()).map(([emoji, v]) => ({ emoji, ...v }))
}

export default function ChatMessageBubble({
  message, isOwn, isAdmin, currentUserId, isHighlighted, onAdminAction, onReact, onEdit, onReply, onScrollToMessage,
}: Props) {
  const { sender, body, image_url, is_announcement, is_pinned, created_at, edited_at, reactions = [] } = message
  if (!sender) return null

  const isAdminSender = sender.role === 'admin'
  const time = new Date(created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  const reactionGroups = groupReactions(reactions, currentUserId)

  const [showPicker, setShowPicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(body ?? '')
  const [saving, setSaving] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showPicker) return
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setShowPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showPicker])

  async function saveEdit() {
    const trimmed = editDraft.trim()
    if (!trimmed || trimmed === body) { setIsEditing(false); return }
    setSaving(true)
    await onEdit(message.id, trimmed)
    setSaving(false)
    setIsEditing(false)
  }

  if (is_announcement) {
    return (
      <div className="w-full px-4 py-1 group">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-600 font-semibold mb-1">📣 Anunț de la echipă</p>
          {body && <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{linkifyText(body)}</p>}
          {image_url && (
            <a href={image_url} target="_blank" rel="noopener noreferrer">
              <img src={image_url} alt="imagine" className="mt-2 max-h-60 rounded-lg mx-auto cursor-pointer" loading="lazy" />
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1" suppressHydrationWarning>{time} · {sender.name || sender.email}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-1 justify-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onAdminAction(message.id, 'delete')} className="text-base hover:scale-110 transition-transform" title="Șterge">🗑️</button>
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

        {/* Bubble */}
        {isEditing ? (
          <div className="bg-white border-2 border-brand-400 rounded-2xl px-3 py-2 min-w-[180px]">
            <textarea
              autoFocus
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() }
                if (e.key === 'Escape') { setIsEditing(false); setEditDraft(body ?? '') }
              }}
              rows={2}
              className="w-full resize-none text-sm text-gray-900 bg-transparent focus:outline-none leading-snug"
            />
            <div className="flex gap-3 mt-1.5">
              <button
                onClick={saveEdit}
                disabled={saving || !editDraft.trim()}
                className="text-xs font-semibold text-brand-600 disabled:opacity-40"
              >
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditDraft(body ?? '') }}
                className="text-xs text-gray-400"
              >
                Anulează
              </button>
            </div>
          </div>
        ) : (
          <div className={`relative rounded-2xl px-3 py-2 transition-colors ${
            isOwn
              ? 'bg-brand-600 text-white rounded-br-sm'
              : isAdminSender
                ? 'bg-amber-50 text-gray-900 border border-amber-200 rounded-bl-sm'
                : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
          } ${isHighlighted ? 'ring-2 ring-brand-400' : ''}`}>
            {message.reply_to && (
              <button
                type="button"
                onClick={() => onScrollToMessage(message.reply_to!.id)}
                className={`block w-full text-left mb-2 rounded-lg px-2 py-1 border-l-4 ${
                  isOwn ? 'border-brand-300 bg-brand-700/20' : 'border-gray-300 bg-gray-50'
                } hover:opacity-80 transition-opacity`}
              >
                <p className={`text-xs font-semibold truncate ${isOwn ? 'text-brand-200' : 'text-gray-500'}`}>
                  {message.reply_to.sender.name || message.reply_to.sender.email}
                </p>
                <p className={`text-xs truncate ${isOwn ? 'text-brand-200' : 'text-gray-500'}`}>
                  {message.reply_to.body ?? '(imagine)'}
                </p>
              </button>
            )}
            {is_pinned && (
              <span className={`text-xs block mb-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>📌 fixat</span>
            )}
            {body && (
              <p className="text-sm whitespace-pre-wrap break-words">
                {linkifyText(body, isOwn
                  ? 'underline break-all opacity-80 hover:opacity-100 text-white'
                  : 'underline break-all opacity-80 hover:opacity-100')}
              </p>
            )}
            {image_url && (
              <a href={image_url} target="_blank" rel="noopener noreferrer">
                <img src={image_url} alt="imagine" className="mt-1 max-h-60 max-w-full rounded-lg cursor-pointer" loading="lazy" />
              </a>
            )}
            <span className={`text-[10px] block text-right mt-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>
              {time}{edited_at ? ' · editat' : ''}
            </span>
          </div>
        )}

        {/* Reaction badges */}
        {reactionGroups.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {reactionGroups.map(({ emoji, count, mine }) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors ${
                  mine
                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span>{emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action bar: react + edit + admin */}
        <div className={`flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity relative ${isOwn ? 'flex-row-reverse' : ''}`}>

          {/* React picker trigger */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setShowPicker(p => !p)}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors leading-none px-1"
              title="Reacționează"
            >
              😊
            </button>
            {showPicker && (
              <div className={`absolute bottom-full mb-1 z-20 flex gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 ${
                isOwn ? 'right-0' : 'left-0'
              }`}>
                {REACTION_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => { onReact(message.id, e); setShowPicker(false) }}
                    className="text-lg hover:scale-125 active:scale-110 transition-transform leading-none"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply button */}
          <button
            onClick={() => onReply(message)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
            title="Răspunde"
          >
            ↩️
          </button>

          {/* Edit button — own messages only */}
          {isOwn && body && !isEditing && (
            <button
              onClick={() => { setIsEditing(true); setEditDraft(body) }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-1"
              title="Editează mesajul"
            >
              ✏️
            </button>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <>
              <button onClick={() => onAdminAction(message.id, 'pin')} className="text-base hover:scale-110 transition-transform" title={is_pinned ? 'Dezfixează' : 'Fixează'}>
                {is_pinned ? '📌' : '📍'}
              </button>
              <button onClick={() => onAdminAction(message.id, 'announce')} className="text-base hover:scale-110 transition-transform" title="Marchează ca anunț">
                📣
              </button>
              <button onClick={() => onAdminAction(message.id, 'delete')} className="text-base hover:scale-110 transition-transform" title="Șterge">
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
