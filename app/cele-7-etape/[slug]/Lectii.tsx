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

// video_id e fie „123456789", fie „123456789:abcdef1234" pentru clipurile
// Vimeo „Unlisted", care se pot încorpora doar cu codul lor (parametrul h).
function urlPlayer(videoId: string): string {
  const [id, h] = videoId.split(':')
  const cod = h ? `h=${h}&` : ''
  return `https://player.vimeo.com/video/${id}?${cod}dnt=1&title=0&byline=0&portrait=0&autoplay=1`
}

export default function Lectii({
  lectii,
  vazuteInitial,
}: {
  lectii: Lectie[]
  vazuteInitial: string[]
}) {
  // Prima lecție nevăzută (cu video) e selectată de la început și arată o
  // copertă cu buton de redare, ca omul să vadă imediat că aici sunt clipuri.
  // Vimeo se încarcă abia la clic (fațada de mai sus rămâne valabilă).
  const [activa, setActiva] = useState<string | null>(
    () =>
      (lectii.find(l => l.video_id && !vazuteInitial.includes(l.id)) ??
        lectii.find(l => l.video_id))?.id ?? null
  )
  const [pornita, setPornita] = useState<string | null>(null)
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
                    onClick={() => {
                      setActiva(deschisa ? null : l.id)
                      setPornita(deschisa ? null : l.id)
                    }}
                    className="group inline-flex items-start gap-2 text-left font-semibold hover:text-[#8F6E2A] disabled:cursor-default"
                    disabled={!l.video_id}
                    aria-expanded={deschisa}
                  >
                    {l.video_id && (
                      <span
                        aria-hidden
                        className={
                          'mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-[0.6rem] ' +
                          (deschisa
                            ? 'bg-[#B08A3C] text-white'
                            : 'bg-[#133D13] text-[#F1EAE0] group-hover:bg-[#B08A3C]')
                        }
                      >
                        {deschisa ? '■' : '▶'}
                      </span>
                    )}
                    <span>{l.title}</span>
                  </button>
                  {l.duration_seconds ? (
                    <span className="ml-2 text-xs tabular-nums text-[#5E534A]">
                      {durataExacta(l.duration_seconds)}
                    </span>
                  ) : null}

                  {deschisa && l.video_id && pornita !== l.id && (
                    <button
                      type="button"
                      onClick={() => setPornita(l.id)}
                      className="group mt-3 block w-full overflow-hidden rounded-lg bg-[#133D13] text-[#F1EAE0]"
                      aria-label={`Pornește lecția ${l.title}`}
                    >
                      <span className="relative block w-full pt-[56.25%]">
                        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#B08A3C] text-2xl text-[#1C1713] shadow-lg transition group-hover:scale-105">
                            ▶
                          </span>
                          <span className="px-6 text-center font-serif text-lg">{l.title}</span>
                        </span>
                      </span>
                    </button>
                  )}

                  {deschisa && l.video_id && pornita === l.id && (
                    <div className="mt-3 overflow-hidden rounded-lg bg-black">
                      <div className="relative w-full pt-[56.25%]">
                        <iframe
                          src={urlPlayer(l.video_id)}
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
