// Aterizarea linkului magic trimis după plată. Aceeași logică ca la
// „Cele 7 Etape" (vezi app/cele-7-etape/intrare/Intrare.tsx), alt drum.
import { Suspense } from 'react'
import Intrare from '@/app/cele-7-etape/intrare/Intrare'

export const dynamic = 'force-dynamic'

export default function PaginaIntrare() {
  return (
    <Suspense
      fallback={
        <div className="max-w-prose">
          <h1 className="font-serif text-3xl">Se deschide programul…</h1>
        </div>
      }
    >
      <Intrare destinatie="/resetarea-somnului" />
    </Suspense>
  )
}
