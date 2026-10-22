import type { Metadata } from 'next'
import { serif, sans } from '@/app/carte/corpul-nu-citeste-facebook/fonts'
import LegalFooter, { LEGAL } from '@/components/legal/LegalFooter'
import s from '@/app/carte/corpul-nu-citeste-facebook/carte.module.css'

export const metadata: Metadata = {
  title: 'Termeni și condiții — Inginerii Creierului',
  description: 'Termenii și condițiile de vânzare pentru produsele și programele Inginerii Creierului și Psiholog Narcisa Ispas.',
}

const ACTUALIZAT = '22 octombrie 2026'

export default function TermeniGenerali() {
  const mail = <a className={s.link} href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
  return (
    <div className={`${s.page} ${serif.variable} ${sans.variable}`}>
      <header className={s.top}>
        <div className={s.wrap}>
          <a className={s.mark} href="https://ingineriicreierului.ro" style={{ textDecoration: 'none' }}>
            <b>Inginerii</b> <span>Creierului</span>
          </a>
        </div>
      </header>

      <section className={s.section}>
        <div className={`${s.narrow} ${s.terms}`}>
          <p className={s.eyebrow}>Actualizat la {ACTUALIZAT}</p>
          <h1 className={s.h2}>Termeni și condiții de vânzare</h1>

          <h2>1. Cine vinde</h2>
          <p>
            Produsele și programele de mai jos sunt vândute de <strong>{LEGAL.firma}</strong>, cu sediul în Slobozia,
            Str. Nicolae Bălcescu nr. 31, județul Ialomița, înregistrată la Registrul Comerțului sub nr. {LEGAL.regCom},
            CUI {LEGAL.cui} (denumită mai jos „vânzătorul”). Contact: {mail}.
          </p>

          <h2>2. Ce acoperă acești termeni</h2>
          <p>
            Termenii se aplică tuturor achizițiilor făcute online de pe ingineriicreierului.ro, reconstruieste-te.ro și
            app.ingineriicreierului.ro, sub mărcile Inginerii Creierului și Psiholog Narcisa Ispas. Ele se împart în
            patru tipuri:
          </p>
          <ul>
            <li><strong>Conținut digital</strong>: cărți în format electronic, programe înregistrate, fișe și alte materiale descărcabile;</li>
            <li><strong>Programe live</strong>: întâlniri online de grup, la date anunțate, uneori cu înregistrări și grup de suport;</li>
            <li><strong>Programe de însoțire</strong>: programe de mai multe luni, cu protocol, întâlniri și suport;</li>
            <li><strong>Evenimente cu dată fixă</strong>: tabere, ateliere și alte evenimente organizate la o dată sau într-o perioadă stabilită.</li>
          </ul>
          <p>
            Descrierea, conținutul, durata și prețul fiecărui produs sunt cele de pe pagina lui, la momentul comenzii.
            Acolo unde pagina unui produs are condiții proprii (de exemplu, pentru o tabără), acestea se aplică împreună cu
            termenii de față.
          </p>

          <h2>3. Comanda și plata</h2>
          <p>
            Plata se face online, prin card sau prin celelalte metode afișate în pagina de plată, prin procesatorul de plăți
            Stripe. Vânzătorul nu primește și nu stochează datele cardului tău. Prețul afișat este prețul final pe care îl
            plătești. Contractul se încheie în momentul în care plata este confirmată, iar factura se emite automat și se
            trimite pe adresa de email folosită la plată.
          </p>
          <p>
            <strong>Plata în rate.</strong> Unde pagina produsului oferă plata în rate, ratele se încasează automat, la datele
            afișate, de pe același card. Suma totală este cea anunțată la comandă. Dacă o rată nu poate fi încasată, te anunțăm,
            iar accesul la program poate fi suspendat până la plata ei.
          </p>
          <p>
            <strong>Abonamente.</strong> Unde un produs se plătește lunar, plata se reînnoiește automat la fiecare lună. Poți
            anula oricând, cu un email la {mail}; anularea are efect la finalul perioadei deja plătite.
          </p>

          <h2>4. Livrarea și accesul</h2>
          <p>
            Pentru conținutul digital primești, imediat după plată, un email cu linkul pentru descărcare sau acces. Pentru programele
            live și de însoțire primești pe email detaliile de acces: datele întâlnirilor, linkurile și, unde e cazul, grupul de
            suport. Înregistrările, unde există, sunt disponibile pe perioada anunțată pe pagina programului.
          </p>
          <p>Dacă nu primești emailul în 15 minute, verifică folderele Spam și Promoții, apoi scrie-ne la {mail}.</p>

          <h2>5. Dreptul de retragere</h2>
          <p>
            Ca regulă, ai dreptul să te retragi dintr-un contract încheiat la distanță în 14 zile, fără să motivezi decizia
            (OUG nr. 34/2014). Pentru tipurile noastre de produse se aplică următoarele:
          </p>
          <p>
            <strong>Conținut digital.</strong> Conform art. 16 lit. m) din OUG nr. 34/2014, dreptul de retragere nu se aplică
            dacă livrarea a început cu acordul tău prealabil expres și după ce ai confirmat că îți pierzi astfel acest drept.
            Acordul îl exprimi în pagina de plată, înainte de finalizarea comenzii.
          </p>
          <p>
            <strong>Programe live și programe de însoțire.</strong> Te poți retrage în 14 zile de la plată. Dacă ai cerut ca
            programul să înceapă în acest interval, plătești doar partea corespunzătoare serviciilor primite până la data la care
            ne anunți retragerea. După ce programul a fost prestat integral, cu acordul tău, dreptul de retragere nu se mai aplică.
          </p>
          <p>
            <strong>Evenimente cu dată fixă.</strong> Pentru serviciile legate de activități de agrement cu o dată sau o perioadă
            stabilită pentru desfășurare, dreptul de retragere nu se aplică (art. 16 lit. l) din OUG nr. 34/2014). Condițiile de
            anulare și de rambursare ale fiecărui eveniment sunt cele de pe pagina lui.
          </p>
          <p>
            <strong>Cum te retragi.</strong> Trimite un email la {mail}, cu numele, adresa folosită la plată și mențiunea că te
            retragi din contract. Banii se returnează în cel mult 14 zile de la primirea cererii, prin aceeași metodă de plată.
          </p>
          <p>
            Independent de cele de mai sus, dacă un fișier nu se poate deschide sau un produs nu corespunde descrierii, scrie-ne
            și remediem problema; dacă nu putem, îți returnăm banii.
          </p>

          <h2>6. Natura programelor</h2>
          <p>
            Produsele și programele au scop educativ și de însoțire. Nu înlocuiesc consultul, diagnosticul sau tratamentul medical
            ori psihiatric și nu sunt servicii de urgență. Nu începe, nu opri și nu schimba un tratament fără medicul tău. În caz de
            urgență, sună la 112. Rezultatele diferă de la om la om și nu sunt garantate.
          </p>

          <h2>7. Confidențialitatea în grupuri</h2>
          <p>
            În programele de grup, ce se spune în grup rămâne în grup. Participanții se obligă să nu înregistreze, să nu
            distribuie și să nu facă publice informațiile personale ale celorlalți.
          </p>

          <h2>8. Drepturi de autor</h2>
          <p>
            Cărțile, înregistrările, fișele, rețetele și celelalte materiale sunt protejate de drepturile de autor. Prin cumpărare
            primești dreptul de a le folosi pentru uz personal. Nu ai dreptul să le copiezi pentru alții, să le distribui, să le
            publici sau să le vinzi, integral ori în parte, fără acordul scris al autorului. Linkurile pentru acces și descărcare
            sunt personale.
          </p>

          <h2>9. Reclamații</h2>
          <p>
            Pentru orice nemulțumire scrie-ne la {mail}. Răspundem în cel mult 15 zile. Ai dreptul să te adresezi Autorității
            Naționale pentru Protecția Consumatorilor (<a className={s.link} href={LEGAL.anpc} target="_blank" rel="noopener">anpc.ro</a>)
            și să folosești procedura de soluționare alternativă a litigiilor
            (<a className={s.link} href={LEGAL.sal} target="_blank" rel="noopener">SAL</a>).
          </p>

          <h2>10. Date personale</h2>
          <p>
            Pentru livrare, acces și facturare folosim numele, adresa de email și datele de facturare pe care le introduci la plată.
            Detaliile sunt în <a className={s.link} href={LEGAL.gdpr} target="_blank" rel="noopener">Politica de confidențialitate (GDPR)</a>.
          </p>

          <h2>11. Legea aplicabilă și modificări</h2>
          <p>
            Acești termeni sunt guvernați de legea română și nu îți limitează drepturile pe care ți le dă legislația privind
            protecția consumatorilor. Vânzătorul poate actualiza termenii; pentru fiecare comandă se aplică versiunea în vigoare la
            data plății.
          </p>
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <LegalFooter />
        </div>
      </footer>
    </div>
  )
}
