import type { Metadata } from 'next'
import { serif, sans } from '../fonts'
import s from '../carte.module.css'


export const metadata: Metadata = {
  title: 'Mulțumim! — Corpul nu citește Facebook',
  robots: { index: false, follow: false },
}

export default function Multumim() {
  return (
    <div className={`${s.page} ${serif.variable} ${sans.variable}`}>
      <header className={s.top}>
        <div className={s.wrap}>
          <div className={s.mark}><b>Inginerii</b> <span>Creierului</span></div>
        </div>
      </header>
      <section className={s.thanks}>
        <div className={s.narrow}>
          <p className={s.eyebrow}>Plata a fost primită</p>
          <h1 className={s.h1}>Mulțumesc! Cartea e pe drum.</h1>
          <ol className={s.steps3}>
            <li><strong>Verifică emailul</strong> folosit la plată. În câteva minute primești un mesaj cu subiectul „Cartea ta: Corpul nu citește Facebook”, cu două butoane: PDF și EPUB.</li>
            <li><strong>Nu-l găsești?</strong> Uită-te și în Spam sau Promoții. Factura vine într-un email separat.</li>
            <li><strong>Începe din capitolul care te privește acum.</strong> Fiecare se termină cu „ce faci concret”.</li>
          </ol>
          <p>Dacă nu ai primit nimic în 15 minute, scrie-ne la{' '}
            <a className={s.link} href="mailto:carte@ingineriicreierului.ro">carte@ingineriicreierului.ro</a>.</p>
          <p style={{ marginTop: 28 }}>Cu drag,<br /><strong>Alin Ispas</strong> · Inginerii Creierului</p>
        </div>
      </section>
    </div>
  )
}
