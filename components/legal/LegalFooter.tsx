// Subsolul legal comun al paginilor publice: datele vânzătorului, termenii,
// politicile, ANPC și pictograma SAL (Ordinul ANPC nr. 449/2022).
// Platforma europeană SOL/ODR a fost desființată la 20 iulie 2025, deci nu mai apare.

import s from './legal.module.css'

export const LEGAL = {
  firma: 'LEADERSHIP2GETHER SRL',
  cui: '34735929',
  regCom: 'J21/225/2015',
  sediu: 'Str. Nicolae Bălcescu nr. 31, Slobozia, Ialomița',
  email: 'carte@ingineriicreierului.ro',
  termeni: 'https://app.ingineriicreierului.ro/termeni',
  gdpr: 'https://docs.google.com/document/d/14YilWzdXV6GMUrSWm5CvCtrzkHg9Yo5M0uAI8jT7J2s/edit',
  cookies: 'https://docs.google.com/document/d/1pbzOUDRRG_QyOgvWUXKWY1ZWPd_RhKrTS4fhxvSpAME/edit',
  anpc: 'https://anpc.ro/',
  sal: 'https://anpc.ro/ce-este-sal/',
}

export default function LegalFooter({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`${s.legal} ${dark ? s.dark : ''}`}>
      <p>
        Vânzător: {LEGAL.firma} · CUI {LEGAL.cui} · {LEGAL.regCom} · {LEGAL.sediu} · Contact:{' '}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
      <nav aria-label="Informații legale">
        <a href={LEGAL.termeni}>Termeni și condiții</a>
        <a href={LEGAL.gdpr} target="_blank" rel="noopener">Politica de confidențialitate (GDPR)</a>
        <a href={LEGAL.cookies} target="_blank" rel="noopener">Politica de cookie-uri</a>
        <a href={LEGAL.anpc} target="_blank" rel="noopener">ANPC</a>
        <a href={LEGAL.sal} target="_blank" rel="noopener">SAL – Soluționarea alternativă a litigiilor</a>
      </nav>
      <a className={s.pict} href={LEGAL.sal} target="_blank" rel="noopener" aria-label="Soluționarea alternativă a litigiilor (ANPC)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/legal/sal-pictograma.png" alt="Soluționarea alternativă a litigiilor" width={201} height={50} loading="lazy" />
      </a>
    </div>
  )
}
