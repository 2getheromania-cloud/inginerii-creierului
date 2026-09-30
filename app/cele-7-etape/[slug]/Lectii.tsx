'use client'

// Lista de lecții a unui modul, cu player.
//
// Player-ul e o fațadă: până la clic nu se face nicio cerere către Vimeo, deci
// pagina nu atârnă de bannerul de cookie-uri. La clic se construiește iframe-ul
// cu dnt=1 — Vimeo nu urmărește privitorul.
//
// Bifarea „am văzut" scrie în lesson_progress prin clientul obișnuit; politica
// RLS verifică user_id = auth.uid(), deci nimeni nu poate bifa pentru altcineva.

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { durataExacta, type Lectie } from '@/lib/sapte-etape'

export default function Lectii({
  lectii,
  vazuteInitial,
}: {
  lectii: Lectie[]
  vazuteInitial: string[]
}) {
  const [activa, setActiva] = useState<string | null>(null)
  const [vazute, setVazute] = useState<Set<string>>(new Set(vazuteInitial))
  const [eroare, setEroare] = useState<string | null>(null)

  async function comuta(lectieId: string) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const eraVazuta = vazute.has(lectieId)
    const urmatoare = new Set(vazute)
    if (eraVazuta) urmatoare.delete(lectieId)
    else urmatoare.add(lectieId)
    setVazute(urmatoare)
    setEroare(null)

    const { error } = eraVazuta
      ? await supabase
          .from('lesson_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lectieId)
      : await supabase
          .from('lesson_progress')
          .upsert({ user_id: user.id, lesson_id: lectieId })

    if (error) {
      setVazute(vazute) // înapoi la starea dinainte
      setEroare('Nu s-a putut salva. Încearcă din nou.')
    }
  }

  if (lectii.length === 0) {
    return (
      <p className="mt-6 text-[#5E534A]">
        Lecțiile modulului nu sunt încă disponibile.
      </p>
    )
  }

  return (
    <div className="mt-8">
      {eroare && (
        <p className="mb-4 rounded-lg border border-[#B08A3C] bg-[#F6EEE2] px-4 py-2 text-sm">
          {eroare}
        </p>
      )}

      <ol className="space-y-px">
        {lectii.map(l => {
          const deschisa = activa === l.id
          return (
            <li key={l.id} className="border-t border-[#E2D8C8] last:border-b">
              <div className="flex items-start gap-3 py-4">
                <button
                  type="button"
                  onClick={() => comuta(l.id)}
                  aria-pressed={vazute.has(l.id)}
                  aria-label={
                    vazute.has(l.id)
                      ? `Scoate bifa de pe ${l.title}`
                      : `Bifează ${l.title} ca văzută`
                  }
                  className={
                    'mt-0.5 h-5 w-5 flex-none rounded border text-xs leading-none ' +
                    (vazute.has(l.id)
                      ? 'border-[#8CA032] bg-[#8CA032] text-white'
                      : 'border-[#CFC2AC] bg-white')
                  }
                >
                  {vazute.has(l.id) ? '✓' : ''}
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setActiva(deschisa ? null : l.id)}
                    className="text-left font-semibold hover:text-[#8F6E2A]"
                    disabled={!l.video_id}
                  >
                    {l.title}
                  </button>
                  {l.duration_seconds ? (
                    <span className="ml-2 text-xs tabular-nums text-[#5E534A]">
                      {durataExacta(l.duration_seconds)}
                    </span>
                  ) : null}

                  {deschisa && l.video_id && (
                    <div className="mt-3 overflow-hidden rounded-lg bg-black">
                      <div className="relative w-full pt-[56.25%]">
                        <iframe
                          src={`https://player.vimeo.com/video/${l.video_id}?dnt=1&title=0&byline=0&portrait=0`}
                          title={l.title}
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
