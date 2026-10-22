import type { Metadata } from 'next'
import { serif, sans } from '../fonts'
import s from '../carte.module.css'

export const metadata: Metadata = {
  title: 'Termeni și condiții de vânzare — Corpul nu citește Facebook',
  robots: { index: true, follow: true },
}

const ACTUALIZAT = '22 octombrie 2026'

export default function Termeni() {
  return (
    <div className={`${s.page} ${serif.variable} ${sans.variable}`}>
      <header className={s.top}>
        <div className={s.wrap}>
          <a className={s.mark} href="/carte/corpul-nu-citeste-facebook" style={{ textDecoration: 'none' }}>
            <b>Inginerii</b> <span>Creierului</span>
          </a>
        </div>
      </header>

      <section className={s.section}>
        <div className={`${s.narrow} ${s.terms}`}>
          <p className={s.eyebrow}>Actualizat la {ACTUALIZAT}</p>
          <h1 className={s.h2}>Termeni și condiții de vânzare pentru cartea digitală „Corpul nu citește Facebook”</h1>

          <h2>1. Cine vinde</h2>
          <p>
            Cartea este vândută de <strong>LEADERSHIP2GETHER SRL</strong>, cu sediul în Slobozia, Str. Nicolae Bălcescu nr. 31,
            județul Ialomița, înregistrată la Registrul Comerțului sub nr. J21/225/2015, CUI 34735929
            (denumită mai jos „vânzătorul”). Contact: <a className={s.link} href="mailto:carte@ingineriicreierului.ro">carte@ingineriicreierului.ro</a>.
          </p>
          <p>
            Acești termeni se aplică achizițiilor făcute de pe pagina{' '}
            <a className={s.link} href="/carte/corpul-nu-citeste-facebook">app.ingineriicreierului.ro/carte/corpul-nu-citeste-facebook</a>.
            Pentru celelalte programe și servicii Inginerii Creierului se aplică termenii proprii ai acestora.
          </p>

          <h2>2. Ce cumperi</h2>
          <p>
            Cartea „Corpul nu citește Facebook. Mituri, jumătăți de adevăr și ce spun de fapt studiile”, de Alin Ispas, în format
            digital: un fișier PDF și un fișier EPUB. Nu se livrează un exemplar tipărit.
          </p>
          <p>
            Cartea are scop educativ. Nu înlocuiește consultul, diagnosticul sau tratamentul medical și nu constituie un sfat medical
            personalizat. Informațiile reflectă studiile verificate până în octombrie 2026.
          </p>

          <h2>3. Prețul și plata</h2>
          <p>
            Prețul este cel afișat pe pagina cărții la momentul comenzii (în prezent, 99 lei) și este prețul final pe care îl plătești.
            Plata se face online, prin card sau prin celelalte metode afișate în pagina de plată, prin procesatorul de plăți Stripe.
            Vânzătorul nu primește și nu stochează datele cardului tău.
          </p>
          <p>Contractul se încheie în momentul în care plata este confirmată. Factura se emite automat și se trimite pe adresa de email folosită la plată.</p>

          <h2>4. Livrarea</h2>
          <p>
            Imediat după confirmarea plății, primești pe adresa de email folosită la plată un mesaj cu un link personal de descărcare,
            pentru ambele formate. Livrarea durează de obicei câteva minute. Linkul poate fi folosit de până la 10 ori în total.
          </p>
          <p>
            Dacă nu primești emailul în 15 minute, verifică folderele Spam și Promoții, apoi scrie-ne la{' '}
            <a className={s.link} href="mailto:carte@ingineriicreierului.ro">carte@ingineriicreierului.ro</a>. Îți retrimitem linkul.
          </p>

          <h2>5. Dreptul de retragere</h2>
          <p>
            Cartea este conținut digital care nu este livrat pe un suport material. Conform art. 16 lit. m) din Ordonanța de urgență
            a Guvernului nr. 34/2014, dreptul de retragere de 14 zile nu se aplică dacă livrarea a început cu acordul tău prealabil
            expres și după ce ai confirmat că ai luat la cunoștință că îți pierzi astfel dreptul de retragere.
          </p>
          <p>
            Prin finalizarea plății îți exprimi acordul ca livrarea să înceapă imediat și confirmi că ai luat la cunoștință că, odată
            cu livrarea, îți pierzi dreptul de retragere.
          </p>
          <p>
            Dacă fișierele nu se pot deschide sau nu corespund descrierii, scrie-ne și remediem problema: îți trimitem fișiere
            corecte sau, dacă nu putem, îți returnăm banii.
          </p>

          <h2>6. Ce poți face cu cartea</h2>
          <p>
            Drepturile de autor asupra cărții aparțin autorului, Alin Ispas. Prin cumpărare primești dreptul de a citi cartea pentru
            uz personal, pe dispozitivele tale. Nu ai dreptul să o copiezi pentru alții, să o distribui, să o publici sau să o vinzi,
            integral ori în parte, fără acordul scris al autorului. Citatele scurte, cu menționarea sursei, sunt permise.
          </p>

          <h2>7. Reclamații</h2>
          <p>
            Pentru orice nemulțumire scrie-ne la{' '}
            <a className={s.link} href="mailto:carte@ingineriicreierului.ro">carte@ingineriicreierului.ro</a>. Răspundem în cel
            mult 15 zile.
          </p>
          <p>
            Ai dreptul să te adresezi Autorității Naționale pentru Protecția Consumatorilor (
            <a className={s.link} href="https://anpc.ro/" target="_blank" rel="noopener">anpc.ro</a>) și să folosești procedura de
            soluționare alternativă a litigiilor (
            <a className={s.link} href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener">SAL</a>).
          </p>

          <h2>8. Date personale</h2>
          <p>
            Pentru livrarea cărții și emiterea facturii folosim numele, adresa de email și datele de facturare pe care le introduci
            la plată. Detaliile sunt în{' '}
            <a className={s.link} href="https://docs.google.com/document/d/14YilWzdXV6GMUrSWm5CvCtrzkHg9Yo5M0uAI8jT7J2s/edit" target="_blank" rel="noopener">Politica de confidențialitate (GDPR)</a>.
          </p>

          <h2>9. Legea aplicabilă</h2>
          <p>
            Acești termeni sunt guvernați de legea română. Ei nu îți limitează drepturile pe care ți le dă legislația privind
            protecția consumatorilor. Vânzătorul poate actualiza termenii; pentru fiecare comandă se aplică versiunea în vigoare la
            data plății.
          </p>
        </div>
      </section>
    </div>
  )
}
