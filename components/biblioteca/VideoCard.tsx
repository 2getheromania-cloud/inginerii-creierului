'use client'
import { useState } from 'react'
import { getVideoEmbedUrl } from '@/lib/utils'
import type { VideoResource } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  somn:      'Somn',
  microbiom: 'Microbiom',
  stres:     'Stres',
  nutritie:  'Nutriție',
  mindset:   'Mindset',
  tiroida:   'Tiroidă',
  general:   'General',
}

const CATEGORY_COLORS: Record<string, string> = {
  somn:      'bg-indigo-100 text-indigo-700',
  microbiom: 'bg-green-100 text-green-700',
  stres:     'bg-orange-100 text-orange-700',
  nutritie:  'bg-lime-100 text-lime-700',
  mindset:   'bg-purple-100 text-purple-700',
  tiroida:   'bg-pink-100 text-pink-700',
  general:   'bg-gray-100 text-gray-700',
}

export default function VideoCard({ video }: { video: VideoResource }) {
  const [open, setOpen] = useState(false)
  const embedUrl = getVideoEmbedUrl(video.video_url)

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Thumbnail / embed area */}
      <div className="relative bg-gray-900 aspect-video">
        {open && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-3 group"
          >
            <div className="w-14 h-14 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center">
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="text-white/70 text-xs">Click pentru redare</span>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start gap-2 justify-between">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[video.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABELS[video.category] ?? video.category}
          </span>
          {!embedUrl && (
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand-600 hover:underline"
            >
              Deschide →
            </a>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{video.title}</h3>
        {video.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{video.description}</p>
        )}
      </div>
    </div>
  )
}
