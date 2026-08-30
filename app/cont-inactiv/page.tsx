import SignOutButton from '@/components/auth/SignOutButton'

export const metadata = { title: 'Cont dezactivat — Inginerii Creierului' }

export default function ContInactivPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/icon-192.png" alt="Inginerii Creierului" className="w-10 h-10 rounded-xl object-cover" />
          <span className="text-lg font-bold text-gray-900">Inginerii Creierului</span>
        </div>

        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-5 text-2xl">
          🔒
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">Cont dezactivat</h1>
        <p className="text-gray-600 leading-relaxed">
          Contul tău este temporar dezactivat. Contactează echipa Inginerii Creierului.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Datele tale (rapoarte, documente, mesaje) sunt păstrate și redevin disponibile
          imediat ce contul este reactivat.
        </p>

        <div className="mt-8">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}
