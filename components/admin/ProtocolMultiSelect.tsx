'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useProtocolTypes } from '@/hooks/useProtocolTypes'

interface Props {
  value: string[]
  onChange: (v: string[]) => void
  disabled?: boolean
}

function DriveIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 87.3 78" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H60l5.55 10.55z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.95 0H34.35c-1.55 0-3.1.4-4.45 1.2z" fill="#00832d"/>
      <path d="M60 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.45 1.2h50.6c1.55 0 3.1-.4 4.45-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5l-12.65-21.8C59.95 3.3 58.8 2.2 57.45 1.4L43.7 25 60.05 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
}

export default function ProtocolMultiSelect({ value, onChange, disabled }: Props) {
  const { data: available } = useProtocolTypes()
  const [query, setQuery]   = useState('')
  const [open, setOpen]     = useState(false)
  const containerRef        = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = available.filter(pt =>
    pt.name.toLowerCase().includes(query.toLowerCase()) &&
    !value.includes(pt.name)
  )

  const exactMatch = available.some(pt => pt.name.toLowerCase() === query.toLowerCase().trim())
  const showCustomAdd = query.trim().length > 0 && !exactMatch && !value.includes(query.trim())

  const add = useCallback((name: string) => {
    if (!value.includes(name)) onChange([...value, name])
    setQuery('')
    inputRef.current?.focus()
  }, [value, onChange])

  const remove = useCallback((name: string) => {
    onChange(value.filter(v => v !== name))
  }, [value, onChange])

  const driveUrl = (name: string) =>
    available.find(pt => pt.name === name)?.drive_url ?? null

  return (
    <div ref={containerRef} className="space-y-2">

      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(name => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-green-50 border border-green-200 text-green-800"
            >
              {name}
              {driveUrl(name) && (
                <a
                  href={driveUrl(name)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Deschide Drive"
                >
                  <DriveIcon />
                </a>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => remove(name)}
                  className="text-green-500 hover:text-green-800 transition-colors leading-none"
                  aria-label={`Elimină ${name}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="input pr-8"
          placeholder="Caută sau adaugă protocol..."
          value={query}
          disabled={disabled}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); setQuery('') }
            if (e.key === 'Enter') {
              e.preventDefault()
              if (filtered.length > 0) add(filtered[0].name)
              else if (showCustomAdd) add(query.trim())
            }
          }}
          autoComplete="off"
        />
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Dropdown */}
        {open && (filtered.length > 0 || showCustomAdd || (query === '' && available.length > 0)) && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {(query === '' ? available.filter(pt => !value.includes(pt.name)) : filtered).map(pt => (
              <button
                key={pt.id}
                type="button"
                onClick={() => add(pt.name)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
              >
                <span className="flex-1 text-gray-800">{pt.name}</span>
                {pt.drive_url && (
                  <span className="flex-shrink-0 text-gray-400" title="Are link Drive">
                    <DriveIcon />
                  </span>
                )}
              </button>
            ))}
            {showCustomAdd && (
              <button
                type="button"
                onClick={() => add(query.trim())}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-green-50 transition-colors border-t border-gray-100"
              >
                <span className="text-green-700 font-medium">+ Adaugă &ldquo;{query.trim()}&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
