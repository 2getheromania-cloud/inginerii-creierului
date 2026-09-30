// Ce vede cineva care ajunge aici fără sesiune sau fără înscriere.
//
// Două situații foarte diferite, și merită mesaje diferite: linkul expirat e
// problema cea mai frecventă în ziua lansării, iar omul trebuie să afle în
// două rânduri ce are de făcut, nu să creadă că a plătit degeaba.

import Link from 'next/link'

export default function FaraAcces({
  motiv,
}: {
  motiv: 'neautentificat' | 'neinscris'
}) {
  if (motiv === 'neautentificat') {
    return (
      <div className="max-w-prose">
        <h1 className="font-serif text-3xl">Intră în program</h1>
        <p className="mt-4">
          Accesul se face prin linkul primit pe email, fără parolă. Linkul e
          valabil o oră; dacă a expirat, cere altul de pe pagina de intrare.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="font-semibold text-[#8F6E2A] underline underline-offset-4"
          >
            Cere un link nou
          </Link>
        </p>
        <p className="mt-6 text-sm text-[#5E534A]">
          Dacă ai plătit și n-a venit niciun email, caută și în Spam sau
          Promoții. Dacă tot nu e acolo, scrie-ne și îl trimitem noi.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-prose">
      <h1 className="font-serif text-3xl">Contul tău nu e înscris aici</h1>
      <p className="mt-4">
        Ești autentificat, dar contul acesta nu are o înscriere activă la „Cele
        7 Etape ale Vindecării".
      </p>
      <p className="mt-4">
        Cel mai des se întâmplă dintr-un singur motiv: plata s-a făcut cu altă
        adresă de email decât cea cu care ești acum conectat. Accesul s-a dus
        acolo. Deconectează-te și intră cu adresa folosită la plată.
      </p>
      <p className="mt-6 text-sm text-[#5E534A]">
        Dacă adresa e aceeași, scrie-ne cu numărul comenzii și rezolvăm în
        aceeași zi.
      </p>
    </div>
  )
}
