'use client'
import { useState } from 'react'
import type { ChatMessage, ChatReaction } from '@/lib/types'
import { linkifyText } from '@/lib/linkify'

const REACTION_EMOJIS = ['❤️', '🙏', '😊', '🔥', '👏', '💪', '🌿']

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
  message, isOwn, isAdmin, currentUserId, isHighlighted,
  onAdminAction, onReact, onEdit, onReply, onScrollToMessage,
}: Props) {
  const { sender, body, image_url, is_announcement, is_pinned, created_at, edited_at, reactions = [] } = message
  if (!sender) return null

  const isAdminSender = sender.role === 'admin'
  const time = new Date(created_at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
  const reactionGroups = groupReactions(reactions, currentUserId)

  const [showPicker, setShowPicker] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editDraft, setEditDraft] = useState(body ?? '')
  const [saving, setSaving] = useState(false)

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
      <div className="w-full px-4 py-1">
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
          <div className="flex gap-1 justify-center mt-1">
            <button onClick={() => onAdminAction(message.id, 'delete')}
              className="w-9 h-9 flex items-center justify-center text-base active:scale-90 transition-transform" title="Șterge">🗑️</button>
          </div>
        )}
      </div>
    )
  }

  const hasMore = isAdmin || (isOwn && !!body)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-3 sm:px-4 py-0.5`}>
      <div className={`flex flex-col max-w-[82%] sm:max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {!isOwn && (
          <span className={`text-xs font-semibold px-1 mb-0.5 ${isAdminSender ? 'text-amber-700' : 'text-brand-700'}`}>
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
              <button onClick={saveEdit} disabled={saving || !editDraft.trim()} className="text-xs font-semibold text-brand-600 disabled:opacity-40">
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
              <button onClick={() => { setIsEditing(false); setEditDraft(body ?? '') }} className="text-xs text-gray-400">Anulează</button>
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
                } active:opacity-70 transition-opacity`}
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
          <div className="flex flex-wrap gap-1 px-1 mt-0.5">
            {reactionGroups.map(({ emoji, count, mine }) => (
              <button key={emoji} onClick={() => onReact(message.id, emoji)}
                className={`flex items-center gap-0.5 text-xs rounded-full px-1.5 py-0.5 border transition-colors ${
                  mine ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                <span>{emoji}</span><span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── Action bar: ALWAYS visible, no hover dependency ── */}
        <div className={`flex items-center ${isOwn ? 'flex-row-reverse' : ''}`}>

          {/* 😊 React */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowMore(false); setShowPicker(p => !p) }}
              className="w-10 h-10 flex items-center justify-center text-base rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >😊</button>

            {showPicker && (
              <>
                {/* Transparent overlay closes picker on outside tap */}
                <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />

                {/* Mobile: bottom sheet (fixed — escapes all overflow) */}
                <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl px-6 pb-6 pt-3 sm:hidden">
                  <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                  <div className="flex justify-around">
                    {REACTION_EMOJIS.map(e => (
                      <button key={e} onClick={() => { onReact(message.id, e); setShowPicker(false) }}
                        className="w-12 h-12 flex items-center justify-center text-2xl active:scale-95 transition-transform"
                      >{e}</button>
                    ))}
                  </div>
                  <button onClick={() => setShowPicker(false)} className="w-full mt-4 py-3 text-sm text-gray-400 border-t border-gray-100">
                    Anulează
                  </button>
                </div>

                {/* Desktop: inline popover */}
                <div className={`absolute bottom-full mb-1 z-50 hidden sm:flex gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 ${isOwn ? 'right-0' : 'left-0'}`}>
                  {REACTION_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(message.id, e); setShowPicker(false) }}
                      className="text-lg hover:scale-125 active:scale-110 transition-transform leading-none"
                    >{e}</button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ↩️ Reply */}
          <button
            type="button"
            onClick={() => onReply(message)}
            className="w-10 h-10 flex items-center justify-center text-base rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >↩️</button>

          {/* ⋯ More (edit + admin actions) */}
          {hasMore && (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setShowPicker(false); setShowMore(p => !p) }}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
                </svg>
              </button>

              {showMore && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />

                  {/* Mobile: bottom sheet */}
                  <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl pb-6 sm:hidden">
                    <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />
                    {isOwn && body && !isEditing && (
                      <button onClick={() => { setIsEditing(true); setEditDraft(body); setShowMore(false) }}
                        className="w-full flex items-center gap-3 px-5 py-4 text-base text-gray-800 active:bg-gray-50">
                        <span>✏️</span><span>Editează mesajul</span>
                      </button>
                    )}
                    {isAdmin && <>
                      <button onClick={() => { onAdminAction(message.id, 'pin'); setShowMore(false) }}
                        className="w-full flex items-center gap-3 px-5 py-4 text-base text-gray-800 active:bg-gray-50">
                        <span>{is_pinned ? '📌' : '📍'}</span><span>{is_pinned ? 'Dezfixează' : 'Fixează'}</span>
                      </button>
                      <button onClick={() => { onAdminAction(message.id, 'announce'); setShowMore(false) }}
                        className="w-full flex items-center gap-3 px-5 py-4 text-base text-gray-800 active:bg-gray-50">
                        <span>📣</span><span>Marchează anunț</span>
                      </button>
                      <button onClick={() => { onAdminAction(message.id, 'delete'); setShowMore(false) }}
                        className="w-full flex items-center gap-3 px-5 py-4 text-base text-red-600 active:bg-red-50">
                        <span>🗑️</span><span>Șterge</span>
                      </button>
                    </>}
                    <button onClick={() => setShowMore(false)}
                      className="w-full py-4 text-sm text-gray-400 border-t border-gray-100">Anulează</button>
                  </div>

                  {/* Desktop: dropdown */}
                  <div className={`absolute bottom-full mb-1 z-50 hidden sm:block bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px] ${isOwn ? 'right-0' : 'left-0'}`}>
                    {isOwn && body && !isEditing && (
                      <button onClick={() => { setIsEditing(true); setEditDraft(body); setShowMore(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <span>✏️</span><span>Editează</span>
                      </button>
                    )}
                    {isAdmin && <>
                      <button onClick={() => { onAdminAction(message.id, 'pin'); setShowMore(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <span>{is_pinned ? '📌' : '📍'}</span><span>{is_pinned ? 'Dezfixează' : 'Fixează'}</span>
                      </button>
                      <button onClick={() => { onAdminAction(message.id, 'announce'); setShowMore(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <span>📣</span><span>Marchează anunț</span>
                      </button>
                      <button onClick={() => { onAdminAction(message.id, 'delete'); setShowMore(false) }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50">
                        <span>🗑️</span><span>Șterge</span>
                      </button>
                    </>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
