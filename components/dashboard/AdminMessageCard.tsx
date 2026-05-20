import { getVideoEmbedUrl } from '@/lib/utils'
import type { AdminMessage } from '@/lib/types'

export default function AdminMessageCard({ message }: { message: AdminMessage }) {
  const embedUrl = message.video_url ? getVideoEmbedUrl(message.video_url) : null

  return (
    <div className="card border-l-4 border-brand-400 bg-brand-50/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📣</span>
        <span className="badge bg-brand-100 text-brand-700 text-xs font-semibold">
          Mesaj de la echipa Inginerii Creierului
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2 text-base">{message.title}</h3>
      <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{message.body}</p>
      {embedUrl && (
        <div className="mt-4 rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={message.title}
          />
        </div>
      )}
    </div>
  )
}
