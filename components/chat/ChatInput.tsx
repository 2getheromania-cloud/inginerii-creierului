'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const EMOJIS = ['😊', '❤️', '🙏', '🌿', '💪', '🔥', '👏']
const MAX_PX = 1280
const QUALITY = 0.82

interface Props {
  userId: string
  onSend: (body: string | null, imageUrl: string | null, imagePath: string | null) => void
  sending: boolean
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        const r = Math.min(MAX_PX / width, MAX_PX / height)
        width = Math.round(width * r)
        height = Math.round(height * r)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', QUALITY)
    }
    img.src = url
  })
}

export default function ChatInput({ userId, onSend, sending }: Props) {
  const [text, setText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  function addEmoji(emoji: string) {
    setText(t => t + emoji)
    textareaRef.current?.focus()
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Imaginea este prea mare. Limita este 5MB.')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if ((!trimmed && !imageFile) || sending || uploading) return

    let imageUrl: string | null = null
    let imagePath: string | null = null

    if (imageFile) {
      setUploading(true)
      try {
        const compressed = await compressImage(imageFile)
        const path = `${userId}/${Date.now()}.jpg`
        const { error } = await supabase.storage
          .from('chat-images')
          .upload(path, compressed, { contentType: 'image/jpeg', upsert: false })
        if (error) throw error
        imagePath = path
        const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      } catch {
        alert('Eroare la încărcarea imaginii. Încearcă din nou.')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    onSend(trimmed || null, imageUrl, imagePath)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    removeImage()
  }

  const busy = sending || uploading
  const canSend = (text.trim().length > 0 || imageFile !== null) && !busy

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white px-4 pt-2 pb-3 space-y-2 flex-shrink-0">
      {/* Emoji bar */}
      <div className="flex gap-2.5">
        {EMOJIS.map(emoji => (
          <button
            key={emoji}
            type="button"
            onClick={() => addEmoji(emoji)}
            className="text-lg leading-none hover:scale-125 transition-transform"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block">
          <img src={imagePreview} alt="preview" className="h-20 rounded-lg object-cover" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 bg-gray-800 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Text + send */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="text-xl text-gray-400 hover:text-brand-600 flex-shrink-0 pb-1 transition-colors"
          title="Atașează imagine"
        >
          📷
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e as unknown as React.FormEvent)
            }
          }}
          placeholder="Scrie un mesaj..."
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 overflow-y-auto"
          style={{ minHeight: '36px', maxHeight: '96px' }}
        />
        <button
          type="submit"
          disabled={!canSend}
          className="bg-brand-600 text-white rounded-full w-9 h-9 flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-brand-700 transition-colors"
        >
          {busy ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 22 6.477 22 12h-4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  )
}
