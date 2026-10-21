import type { Metadata } from 'next'
import Image from 'next/image'
import { serif, sans } from './fonts'
import { CNCF_PAYMENT_LINK } from '@/lib/books'
import s from './carte.module.css'


const URL_PAGINA = 'https://app.ingineriicreierului.ro/carte/corpul-nu-citeste-facebook'
const ASSETS = '/carte/corpul-nu-citeste-facebook'

export const metadata: Metadata = {
  title: 'Corpul nu citește Facebook — Alin Ispas',
  description:
    '36 de afirmații despre sănătate pe care le primești zilnic pe Facebook și WhatsApp, trecute prin filtrul studiilor. Carte digitală, PDF + EPUB, 99 lei.',
  alternates: { canonical: URL_PAGINA },
  openGraph: {
    title: 'Corpul nu citește Facebook',
    description: 'Mituri, jumătăți de adevăr și ce spun de fapt studiile. 36 de afirmații despre sănătate, verificate.',
    url: URL_PAGINA,
    type: 'book',
    locale: 'ro_RO',
    images: [{ url: `${ASSETS}/og.jpg`, width: 1200, height: 630 }],
  },
}

const PARTI: { titlu: string; start: number; capitole: string[] }[] = [
  { titlu: 'I. Intestinul', start: 1, capitole: [
    'Probioticele refac flora după antibiotic', 'Ulcerul vine din stres', 'Refluxul înseamnă prea mult acid',
    'Glutenul face rău tuturor', 'Balonarea vine din Candida', 'Intestinul permeabil stă la baza bolilor autoimune'] },
  { titlu: 'II. Hormonii', start: 7, capitole: [
    'Hashimoto se vindecă prin dietă fără gluten', 'Iodul: cu cât mai mult, cu atât mai bine',
    'Hormonoterapia la menopauză provoacă cancer', 'Soia e periculoasă pentru femei',
    'Oboseala suprarenală explică epuizarea', 'Laptele fură calciul din oase'] },
  { titlu: 'III. Farfuria', start: 13, capitole: [
    'Fibrele sunt un detaliu', 'Fermentatele schimbă microbiomul', 'Micul dejun e cea mai importantă masă a zilei',
    'Metabolismul încetinește după 40 de ani', 'Postul intermitent topește grăsimea',
    'Grăsimile saturate și ouăle înfundă arterele'] },
  { titlu: 'IV. Suplimentele', start: 19, capitole: [
    'Vitamina C previne răceala', 'Vitamina D: cât mai mult', 'Omega-3 protejează inima',
    'Magneziul repară somnul și anxietatea', 'Colagenul reface pielea și articulațiile', 'Spanacul e plin de fier'] },
  { titlu: 'V. Miturile care sperie', start: 25, capitole: [
    'Zahărul hrănește cancerul', 'Alimentele alcaline schimbă pH-ul sângelui', 'Îndulcitorii sunt mai răi decât zahărul',
    'Curele de detox curăță corpul', 'Un pahar de vin roșu pe zi e sănătos', 'Superalimentele vindecă'] },
  { titlu: 'VI. Obiceiurile', start: 31, capitole: [
    'Cafeaua face rău', 'Opt pahare de apă pe zi', '10.000 de pași pe zi',
    'Somnul pierdut se recuperează în weekend', 'Depresia începe în intestin', 'Zece obiceiuri care prelungesc viața'] },
]

function Cumpara({ gold = false }: { gold?: boolean }) {
  return (
    <div className={s.buyBox}>
      <div className={s.price}>99 lei<small>PDF + EPUB</small></div>
      <a className={`${s.btn} ${gold ? s.btnGold : ''}`} href={CNCF_PAYMENT_LINK}>
        Cumpără cartea
      </a>
    </div>
  )
}

export default function Page() {
  return (
    <div className={`${s.page} ${serif.variable} ${sans.variable}`}>
      <header className={s.top}>
        <div className={s.wrap}>
          <div className={s.mark}><b>Inginerii</b> <span>Creierului</span></div>
          <a className={s.topCta} href={CNCF_PAYMENT_LINK}>Cumpără · 99 lei</a>
        </div>
      </header>

      <section className={s.hero}>
        <div className={`${s.wrap} ${s.heroGrid}`}>
          <div>
            <p className={s.eyebrow}>Carte nouă · Alin Ispas</p>
            <h1 className={s.h1}>Corpul nu citește <em>Facebook</em></h1>
            <p className={s.sub}>Mituri, jumătăți de adevăr și ce spun de fapt studiile</p>
            <p className={s.lead}>
              36 de afirmații despre sănătate pe care le primești zilnic pe Facebook și WhatsApp,
              trecute prin același filtru: ce studii există, pe câți oameni, cât de mare e efectul
              și cine a știut ce primește. Și, la final, ce faci concret.
            </p>
            <Cumpara />
            <p className={s.note}>
              Primești cartea pe email în câteva minute, în format PDF și EPUB. Factura vine automat.{' '}
              <a className={s.link} href={`${ASSETS}/fragment.pdf`}>Citește gratuit introducerea</a>
            </p>
          </div>
          <div className={s.heroImg}>
            <Image className={s.heroCover} src={`${ASSETS}/coperta.jpg`} alt="Coperta cărții „Corpul nu citește Facebook” de Alin Ispas"
              width={600} height={900} priority />
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.alt}`}>
        <div className={`${s.narrow} ${s.prose}`}>
          <p className={s.eyebrow}>Știi mesajul acesta</p>
          <h2 className={s.h2}>O linguriță de ceva dimineața și scapi de tiroidă, de balonare, de kilograme.</h2>
          <p>L-a trimis o prietenă, cu cele mai bune intenții. Și totuși… cine a verificat?</p>
          <p>
            Problema nu e lipsa de informație. E prea multă, toată ambalată la fel de convingător.
            Studiul pe șoareci arată ca studiul pe oameni. Mecanismul din eprubetă sună ca un tratament.
            Iar un procent mare spus pe un ton sigur trece drept dovadă.
          </p>
          <p>
            Cartea aceasta nu îți mai dă încă o listă de sfaturi. Îți arată cum să le cântărești singură,
            pe 36 de exemple pe care le întâlnești săptămânal.
          </p>
          <p className={s.big}>Nu vei găsi aici minuni. Vei găsi ceva mai rar: liniștea de a ști ce merită făcut și ce poți lăsa deoparte fără vinovăție.</p>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Cum e construit fiecare capitol</p>
          <h2 className={s.h2}>O poveste, studiile, un verdict și pașii tăi</h2>
          <div className={s.cards}>
            <div className={s.card}><span className={s.num}>01</span><h3>Povestea</h3>
              <p>Fiecare capitol se deschide cu o întâmplare reală: medicul care a băut bacteria ca să-și dovedească ipoteza, oile din Australia care nu mai fătau, varza murată a căpitanului Cook.</p></div>
            <div className={s.card}><span className={s.num}>02</span><h3>Ce spun studiile</h3>
              <p>Patru întrebări, de fiecare dată: ce fel de studiu, câți oameni, cât de mare e efectul, cine a știut ce primește. Cu cifrele scrise în text și sursele în note.</p></div>
            <div className={s.card}><span className={s.num}>03</span><h3>Verdictul</h3>
              <p>Fiecare afirmație primește un verdict și o treaptă pe scara dovezii. Fără „depinde” vag și fără panică.</p></div>
            <div className={s.card}><span className={s.num}>04</span><h3>Ce faci concret</h3>
              <p>Pașii practici, în ordinea dovezilor, nu a popularității. Plus semnalele la care mergi la medic.</p></div>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.dark}`}>
        <div className={s.narrow}>
          <p className={s.eyebrow}>Instrumentul din carte</p>
          <h2 className={s.h2}>Scara dovezii</h2>
          <p>Cea mai frecventă formă de dezinformare nu e minciuna. E un rezultat adevărat de pe treapta de jos, prezentat ca și cum ar fi de pe cea de sus.</p>
          <div className={s.ladder}>
            <div className={s.step}><b>5</b><div><strong>Studii randomizate pe ce contează</strong><span>boală, fractură, infarct, simptomul însuși</span></div></div>
            <div className={s.step}><b>4</b><div><strong>Studii randomizate pe un marker</strong><span>colesterol, glicemie, densitate osoasă</span></div></div>
            <div className={s.step}><b>3</b><div><strong>Mecanism la om și studii observaționale</strong><span>o corelație, nu încă o cauză</span></div></div>
            <div className={s.step}><b>2</b><div><strong>Animal</strong><span>funcționează la șoarece</span></div></div>
            <div className={s.step}><b>1</b><div><strong>Eprubetă</strong><span>funcționează într-un vas de laborator</span></div></div>
          </div>
          <div className={s.verdicts}>
            <span className={`${s.pill} ${s.solid}`}>SOLID</span>
            <span className={`${s.pill} ${s.partial}`}>PARȚIAL</span>
            <span className={`${s.pill} ${s.no}`}>NU REZISTĂ</span>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Două exemple din carte</p>
          <h2 className={s.h2}>Ce rămâne când cauți studiile</h2>
          <div className={s.examples}>
            <div className={s.ex}>
              <span className={`${s.pill} ${s.no}`}>NU REZISTĂ</span>
              <p className={s.claim}>„Spanacul e plin de fier”</p>
              <p>În 1969, cercetătorii au măsurat direct cât fier se absoarbe din alimente, marcându-l cu un izotop. Din spanac s-a absorbit, în medie, 1,7%, la 9 voluntari. Din carnea de vițel, aproximativ 20%.</p>
              <p className={s.meta}>Capitolul 24 · plus ce faci, concret, dacă fierul tău e scăzut după menopauză</p>
            </div>
            <div className={s.ex}>
              <span className={`${s.pill} ${s.partial}`}>PARȚIAL</span>
              <p className={s.claim}>„Probioticele refac flora după antibiotic”</p>
              <p>Că refac flora mai repede: o meta-analiză independentă din 2023, pe 15 studii, nu a găsit nicio diferență semnificativă. Că previn diareea: da, dar mai ales la anumiți oameni, iar capitolul îți spune la care.</p>
              <p className={s.meta}>Capitolul 1 · și cum citești eticheta unui probiotic</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.alt}`}>
        <div className={s.wrap}>
          <p className={s.eyebrow}>Cuprinsul</p>
          <h2 className={s.h2}>36 de afirmații, în șase părți</h2>
          <div className={s.parts}>
            {PARTI.map((p) => (
              <div className={s.part} key={p.titlu}>
                <h3>{p.titlu}</h3>
                <ol>
                  {p.capitole.map((c, i) => (
                    <li key={c}><i>{p.start + i}</i><span>„{c}”</span></li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.narrow}>
          <p className={s.eyebrow}>Pentru cine e cartea</p>
          <h2 className={s.h2}>Pentru tine, dacă…</h2>
          <ul className={s.forWho}>
            <li>primești zilnic sfaturi de sănătate și nu mai știi pe care să le crezi;</li>
            <li>ai o tiroidă, o digestie sau o menopauză care te-au trimis deja prin zeci de articole și suplimente;</li>
            <li>vrei să mergi la medic cu întrebări bune, nu cu capturi de ecran;</li>
            <li>te-ai săturat să fii tratată ca naivă, dar nici nu ai timp să citești studii în engleză.</li>
          </ul>
        </div>
      </section>

      <section className={`${s.section} ${s.alt}`}>
        <div className={`${s.wrap} ${s.author}`}>
          <Image className={s.authorCover} src={`${ASSETS}/coperta.jpg`} alt="Coperta cărții" width={600} height={900} />
          <div>
            <p className={s.eyebrow}>Despre autor</p>
            <h2 className={s.h2}>Alin Ispas</h2>
            <p>
              Fondatorul Inginerii Creierului, o companie care cercetează dovezile științifice despre nutriție
              și stil de viață și creează programe de educație pentru consumatorii de servicii medicale din România.
              Conduce compania împreună cu soția sa, psiholog Narcisa Ispas. Este autorul cărților „Cei 7 ani” și
              „Apocalipsa în Leadership”.
            </p>
            <p>Cartea s-a născut din live-urile Inginerii Creierului și din întrebările participanților. Fiecare „dar am citit că…” a devenit, până la urmă, un capitol.</p>
          </div>
        </div>
      </section>

      <section className={s.section}>
        <div className={s.narrow}>
          <p className={s.eyebrow}>Întrebări frecvente</p>
          <h2 className={s.h2}>Bine de știut</h2>
          <div className={s.faq}>
            <details><summary>Ce primesc, mai exact?</summary>
              <p>Cartea întreagă în două formate: PDF (circa 600 de pagini, cu cuprins pe care se poate da clic și infograficele în culori) și EPUB, pentru cititoare electronice și aplicații de citit. Le primești pe email, pe adresa folosită la plată, în câteva minute.</p></details>
            <details><summary>Pot să o citesc pe telefon?</summary>
              <p>Da. PDF-ul se deschide pe orice telefon, tabletă sau calculator. Pe telefon, EPUB-ul e mai comod, pentru că textul se așază după ecran și poți mări litera (de exemplu în Apple Books sau Google Play Books).</p></details>
            <details><summary>Merge pe Kindle?</summary>
              <p>Da. Trimite fișierul EPUB prin „Send to Kindle” (aplicația sau site-ul Amazon) și apare în biblioteca ta Kindle.</p></details>
            <details><summary>Primesc factură?</summary>
              <p>Da, factura se emite automat și vine pe email, separat de carte.</p></details>
            <details><summary>Există și varianta tipărită?</summary>
              <p>Lucrăm la ea. Deocamdată cartea e disponibilă în format digital.</p></details>
            <details><summary>Cartea înlocuiește medicul?</summary>
              <p>Nu. Are scop educativ și te ajută să pui întrebări mai bune. Nu începe, nu opri și nu schimba un tratament fără medicul tău.</p></details>
            <details><summary>Nu am primit emailul. Ce fac?</summary>
              <p>Verifică și folderul Spam sau Promoții. Dacă nu îl găsești în 15 minute, scrie-ne la <a className={s.link} href="mailto:carte@ingineriicreierului.ro">carte@ingineriicreierului.ro</a>.</p></details>
          </div>
        </div>
      </section>

      <section className={`${s.section} ${s.dark} ${s.final}`}>
        <div className={s.narrow}>
          <h2 className={s.h2}>Corpul tău nu citește Facebook. Tu, da.</h2>
          <p>Și de acum știi să citești altfel.</p>
          <Cumpara gold />
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.wrap}>
          <p>Cartea are scop educativ și nu înlocuiește consultul, diagnosticul sau tratamentul medical. În caz de urgență, sună la 112.</p>
          <p>© 2026 Alin Ispas · Inginerii Creierului · <a className={s.link} href="https://ingineriicreierului.ro">ingineriicreierului.ro</a></p>
        </div>
      </footer>
    </div>
  )
}
