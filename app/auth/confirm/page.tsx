import { Suspense } from 'react'
import AuthConfirmClient from './AuthConfirmClient'

function ConfirmLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-50">
      <div className="card max-w-sm w-full text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Se autentifică...</h2>
        <p className="text-gray-500 text-sm">Te rugăm să aștepți câteva secunde.</p>
      </div>
    </div>
  )
}

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={<ConfirmLoading />}>
      <AuthConfirmClient />
    </Suspense>
  )
}
