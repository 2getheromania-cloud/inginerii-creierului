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

// Inline styles for action buttons — guaranteed visible regardless of Tailwind
const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '5px 12px',
  borderRadius: '20px',
  background: '#f3f4f6',
  color: '#374151',
  fontSize: '17px',
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
}

// Inline styles for bottom sheet overlay (fixed, escapes all overflow)
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40,
}
const sheetStyle: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
  background: 'white',
  borderRadius: '20px 20px 0 0',
  boxShadow: '0 -4px 24px rgba(0,0,0,0.18)',
  padding: '12px 24px 32px',
}
const sheetHandleStyle: React.CSSProperties = {
  width: 40, height: 4, background: '#e5e7eb', borderRadius: 2,
  margin: '0 auto 16px',
}
const sheetEmojiRowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-around', marginBottom: '12px',
}
const sheetEmojiBtnStyle: React.CSSProperties = {
  width: 48, height: 48, display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 26, border: 'none',
  background: 'transparent', cursor: 'pointer',
}
const sheetCancelStyle: React.CSSProperties = {
  width: '100%', padding: '12px 0', fontSize: 13, color: '#9ca3af',
  background: 'transparent', border: 'none', borderTop: '1px solid #f3f4f6',
  cursor: 'pointer', marginTop: 4,
}
const sheetRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 12,
  padding: '14px 4px', fontSize: 15, color: '#1f2937',
  background: 'transparent', border: 'none', cursor: 'pointer',
  width: '100%', textAlign: 'left',
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

  // Reply card — only computed/used when reply_to_id is set
  const replyAuthor = message.reply_to?.sender?.name
    || message.reply_to?.sender?.email
    || null
  const replyContent = message.reply_to?.body
    || (message.reply_to?.image_url ? '📷 Imagine' : null)
    || 'Mesaj original indisponibil'

  if (is_announcement) {
    return (
      <div className="w-full px-4 py-1">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-sm text-amber-600 font-semibold mb-1">📣 Anunț de la echipă</p>
          {body && <p className="text-lg text-gray-800 whitespace-pre-wrap break-words leading-relaxed">{linkifyText(body)}</p>}
          {image_url && (
            <a href={image_url} target="_blank" rel="noopener noreferrer">
              <img src={image_url} alt="imagine" className="mt-2 max-h-60 rounded-lg mx-auto cursor-pointer" loading="lazy" />
            </a>
          )}
          <p className="text-sm text-gray-400 mt-1" suppressHydrationWarning>{time} · {sender.name || sender.email}</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button onClick={() => onAdminAction(message.id, 'delete')} style={pillStyle}>🗑️ Șterge</button>
          </div>
        )}
      </div>
    )
  }

  const hasMore = isAdmin || (isOwn && !!body)

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} px-3 py-0.5`}>
      <div className={`flex flex-col max-w-[82%] ${isOwn ? 'items-end' : 'items-start'}`}>

        {!isOwn && (
          <span className={`text-base font-semibold px-1 mb-0.5 ${isAdminSender ? 'text-amber-700' : 'text-brand-700'}`}>
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
          <div className={`relative rounded-2xl px-3 py-2 ${
            isOwn
              ? 'bg-brand-600 text-white rounded-br-sm'
              : isAdminSender
                ? 'bg-amber-50 text-gray-900 border border-amber-200 rounded-bl-sm'
                : 'bg-white text-gray-900 shadow-sm rounded-bl-sm'
          } ${isHighlighted ? 'ring-2 ring-brand-400' : ''}`}>
            {message.reply_to_id && (
              <button
                type="button"
                onClick={() => onScrollToMessage(message.reply_to?.id ?? message.reply_to_id!)}
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
                {replyAuthor && (
                  <p style={{
                    fontSize: 13, fontWeight: 600, marginBottom: 2, lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    color: isOwn ? 'rgba(255,255,255,0.9)' : '#16a34a',
                  }}>
                    {replyAuthor}
                  </p>
                )}
                <p style={{
                  fontSize: 13, lineHeight: 1.35, margin: 0,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  color: isOwn ? 'rgba(255,255,255,0.65)' : '#6b7280',
                } as React.CSSProperties}>
                  {replyContent}
                </p>
              </button>
            )}
            {is_pinned && (
              <span className={`text-xs block mb-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`}>📌 fixat</span>
            )}
            {body && (
              <p className="text-lg whitespace-pre-wrap break-words leading-relaxed">
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
            <span className={`text-sm block text-right mt-1 ${isOwn ? 'text-brand-200' : 'text-gray-400'}`} suppressHydrationWarning>
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
                  mine ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-gray-200 text-gray-600'
                }`}>
                <span>{emoji}</span><span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* ─── ACTION BAR: always visible, labeled, static layout ─── */}
        {/* Uses inline styles — NOT dependent on Tailwind build or CSS breakpoints */}
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>

          {/* 😊 Reacție */}
          <button
            type="button"
            onClick={() => { setShowMore(false); setShowPicker(p => !p) }}
            style={pillStyle}
          >
            <span>😊</span><span>Reacție</span>
          </button>

          {/* ↩️ Răspunde */}
          <button
            type="button"
            onClick={() => onReply(message)}
            style={pillStyle}
          >
            <span>↩️</span><span>Răspunde</span>
          </button>

          {/* ⋯ Mai mult */}
          {hasMore && (
            <button
              type="button"
              onClick={() => { setShowPicker(false); setShowMore(p => !p) }}
              style={pillStyle}
            >
              <span>⋯</span>
            </button>
          )}
        </div>

        {/* ─── EMOJI PICKER — fixed bottom sheet, works on all screen sizes ─── */}
        {showPicker && (
          <>
            <div style={overlayStyle} onClick={() => setShowPicker(false)} />
            <div style={sheetStyle}>
              <div style={sheetHandleStyle} />
              <div style={sheetEmojiRowStyle}>
                {REACTION_EMOJIS.map(e => (
                  <button key={e} style={sheetEmojiBtnStyle}
                    onClick={() => { onReact(message.id, e); setShowPicker(false) }}
                  >{e}</button>
                ))}
              </div>
              <button style={sheetCancelStyle} onClick={() => setShowPicker(false)}>Anulează</button>
            </div>
          </>
        )}

        {/* ─── MORE MENU — fixed bottom sheet ─── */}
        {showMore && (
          <>
            <div style={overlayStyle} onClick={() => setShowMore(false)} />
            <div style={sheetStyle}>
              <div style={sheetHandleStyle} />
              {isOwn && body && !isEditing && (
                <button style={sheetRowStyle}
                  onClick={() => { setIsEditing(true); setEditDraft(body); setShowMore(false) }}>
                  <span style={{ fontSize: 20 }}>✏️</span><span>Editează mesajul</span>
                </button>
              )}
              {isAdmin && (
                <>
                  <button style={sheetRowStyle}
                    onClick={() => { onAdminAction(message.id, 'pin'); setShowMore(false) }}>
                    <span style={{ fontSize: 20 }}>{is_pinned ? '📌' : '📍'}</span>
                    <span>{is_pinned ? 'Dezfixează' : 'Fixează'}</span>
                  </button>
                  <button style={sheetRowStyle}
                    onClick={() => { onAdminAction(message.id, 'announce'); setShowMore(false) }}>
                    <span style={{ fontSize: 20 }}>📣</span><span>Marchează anunț</span>
                  </button>
                  <button style={{ ...sheetRowStyle, color: '#dc2626' }}
                    onClick={() => { onAdminAction(message.id, 'delete'); setShowMore(false) }}>
                    <span style={{ fontSize: 20 }}>🗑️</span><span>Șterge</span>
                  </button>
                </>
              )}
              <button style={sheetCancelStyle} onClick={() => setShowMore(false)}>Anulează</button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
