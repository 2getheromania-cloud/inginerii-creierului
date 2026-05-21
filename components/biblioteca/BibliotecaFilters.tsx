'use client'
import { useState, useMemo } from 'react'
import VideoCard from './VideoCard'
import { cn } from '@/lib/utils'
import type { VideoResource, VideoCategory } from '@/lib/types'

const CATEGORIES: { key: VideoCategory | 'all'; label: string }[] = [
  { key: 'all',      label: 'Toate' },
  { key: 'microbiom', label: 'Microbiom' },
  { key: 'nutritie', label: 'Nutriție' },
  { key: 'somn',     label: 'Somn' },
  { key: 'stres',    label: 'Stres' },
  { key: 'mindset',  label: 'Mindset' },
  { key: 'tiroida',  label: 'Tiroidă' },
  { key: 'general',  label: 'General' },
]

export default function BibliotecaFilters({ videos }: { videos: VideoResource[] }) {
  const [cat, setCat] = useState<VideoCategory | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let list = videos
    if (cat !== 'all') list = list.filter(v => v.category === cat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(v =>
        v.title.toLowerCase().includes(q) ||
        (v.description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [videos, cat, search])

  const availableCats = useMemo(
    () => new Set(videos.map(v => v.category)),
    [videos]
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Caută video..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="input w-full max-w-sm text-sm"
      />

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.filter(c => c.key === 'all' || availableCats.has(c.key as VideoCategory)).map(c => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={cn(
              'text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors',
              cat === c.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
            )}
          >
            {c.label}
            {c.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-60">
                {videos.filter(v => v.category === c.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🎬</p>
          <p className="font-medium">Nicio resursă video disponibilă momentan.</p>
          <p className="text-sm mt-1">Revino curând — conținut nou este adăugat săptămânal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(v => <VideoCard key={v.id} video={v} />)}
        </div>
      )}
    </div>
  )
}
