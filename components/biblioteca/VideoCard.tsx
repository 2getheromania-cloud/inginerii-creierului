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

function withAutoplay(embedUrl: string): string {
  const sep = embedUrl.includes('?') ? '&' : '?'
  return `${embedUrl}${sep}autoplay=1&rel=0`
}

export default function VideoCard({ video }: { video: VideoResource }) {
  const [playing, setPlaying] = useState(false)
  const embedBase = getVideoEmbedUrl(video.video_url)

  return (
    <div className="card p-0 overflow-hidden flex flex-col">
      {/* Video area — fixed aspect ratio */}
      <div className="relative bg-gray-900 w-full" style={{ paddingBottom: '56.25%' }}>

        {/* Playing: real iframe with autoplay */}
        {playing && embedBase && (
          <iframe
            src={withAutoplay(embedBase)}
            className="absolute inset-0 w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; web-share"
            title={video.title}
          />
        )}

        {/* Overlay: shown only when not playing */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {embedBase ? (
              /* Has valid embed — clickable play button */
              <button
                onClick={() => setPlaying(true)}
                className="flex flex-col items-center gap-3 group w-full h-full justify-center"
                aria-label={`Redă ${video.title}`}
              >
                <div className="w-16 h-16 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <span className="text-white/60 text-xs">Click pentru redare</span>
              </button>
            ) : (
              /* No embed support — open in new tab */
              <div className="flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.893L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl"
                >
                  Deschide video →
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 justify-between flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[video.category] ?? 'bg-gray-100 text-gray-600'}`}>
            {CATEGORY_LABELS[video.category] ?? video.category}
          </span>
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-brand-600 transition-colors"
          >
            Deschide →
          </a>
        </div>
        <h3 className="font-semibold text-gray-900 text-sm leading-snug">{video.title}</h3>
        {video.description && (
          <p className="text-xs text-gray-500 leading-relaxed">{video.description}</p>
        )}
      </div>
    </div>
  )
}
