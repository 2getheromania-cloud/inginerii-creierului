import React from 'react'

const URL_RE = /(https?:\/\/[^\s<>"']+)/g

export function isImageUrl(text: string): boolean {
  const t = text.trim()
  if (!/^https?:\/\/\S+$/.test(t)) return false
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(t) ||
    t.includes('/storage/v1/object/public/chat-images/')
}

export function linkifyText(
  text: string,
  linkClass = 'underline break-all opacity-80 hover:opacity-100',
): React.ReactNode[] {
  const parts = text.split(URL_RE)
  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={linkClass}>
        {part}
      </a>
    ) : (
      part
    )
  )
}
