import React from 'react'

const URL_RE = /(https?:\/\/[^\s<>"']+)/g

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
