import { Suspense } from 'react'
import Intrare from './Intrare'

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
      <Intrare />
    </Suspense>
  )
}
