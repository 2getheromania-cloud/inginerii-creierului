// Cursul „Program Refacere Microbiom Intestinal" — structura pe săptămâni.
//
// Sursele: documentul „TOATE MATERIALELE — Program Refacere Microbiom (6 luni)"
// și „Planul de acțiune" din Google Drive, aliniate la calendarul din contract:
// 16 săptămâni intensive + 8 săptămâni de monitorizare.
//
// Materialele rămân în Google Drive, partajate nominal pe emailul fiecărui
// cursant. Aplicația doar le așază: secțiune, titlu, descriere, săptămâna în
// care se deschid. Pentru a schimba un link sau a adăuga un material, se
// editează doar acest fișier.

export type TipMaterial =
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'folder'
  | 'youtube'
  | 'pagina'
  | 'pas'

export interface Material {
  titlu: string
  descriere?: string
  tip: TipMaterial
  url?: string
  /** Săptămâna din care se deschide; lipsă = odată cu secțiunea. */
  saptamana?: number
  /** Materialul nu e încă gata. */
  inLucru?: boolean
}

export interface Grup {
  titlu?: string
  materiale: Material[]
  /** Afișare compactă, ca un rând de butoane (ex. zilele de wellness). */
  compact?: boolean
}

export interface Sectiune {
  slug: string
  /** Numărul afișat în listă (ex. „1"), sau un semn pentru secțiunile extra. */
  numar: string
  titlu: string
  rezumat: string
  /** Prima și ultima săptămână. Secțiunile extra au deLa = 1. */
  deLa: number
  panaLa: number
  obiectiv?: string
  intalniri?: string
  nota?: string
  extra?: boolean
  grupuri: Grup[]
}

// Dacă e false, cursanții văd tot programul deschis, ca în pagina Resurse.
export const BLOCARE_PE_SAPTAMANI = true

export const TOTAL_SAPTAMANI = 24
export const SAPTAMANI_INTENSIVE = 16

const fisier = (id: string) => `https://drive.google.com/file/d/${id}/view`
const folder = (id: string) => `https://drive.google.com/drive/folders/${id}`
const doc = (id: string) => `https://docs.google.com/document/d/${id}/edit`
const site = (cale: string) => `https://ingineriicreierului.ro/wp-content/uploads/${cale}`

const TESTE_SIMPTOMATOLOGIE = doc('1N84crIydGWBuh_tLLfgmsscBjOv-7_d2HlN8imxpZiE')
const SUPLIMENTE_MICROBIOM = doc('1xD9oMmTr_OD8NotMj_aM0A5yQKiX9ty_MNzwMtA1RhQ')
const FOLDER_POST_INTERMITENT = folder('1VPBPtgZz33Shuy3uHLSKnHWQmT9-kuM_')
const FOLDER_BONUS = folder('1ErbCf36lsSfU8scnRN-HlX7uDNqfx5Ka')
const PROGRAM_FORTA = site('2025/07/PROGRAM-SAPTAMANAL-%E2%80%93-3-zilesaptamana-full-body.pdf')
const NERV_VAG = site('2025/11/Calm-in-60-de-secunde-%E2%80%93-Respiratia-care-reeduca-sistemul-nervos-.pdf')

const ZILE_TIROIDA = [
  '1huktdG9XVULtQ90U3i1v0INwiCmiZY4gNgwA7LedVW0',
  '1XJSEr_Et_GCRxbaLlvbELRmNkLq8X8mIACuSOYhaja0',
  '1C7kzbr4VrvXLN3p1BMNWZqnOaZw21B6Q534CedNxBN0',
  '10JbX5ST2Ik_SUl2vXBrXeDuyB3NPx_zPJZpdp3KXRVk',
  '1_OE6K9mX5sJAbvR_BtE7KbQSp9SSv-Fxv7W2rJq9ymo',
  '18Kzn2uqWB0IpwlzRQIdXvpqxsOLb6jULSFxjVwhbPr8',
  '1V1mTZSL670BsMCm2krbLxyEv0dmI8lhHYBY2C2TQ7wE',
  '1JxbIXAknv1pgWagFwQ24W2iU9JjvCyG46dTRVvl4EkA',
  '1-nAIfgSYrkndaIQ-rTx-2FKwdMN6HV6Lc9DxWuw-mbg',
  '1jz2Gbaf6vBJKGrCHrAJDtiMsAC05XmGwmDeGwZFZpr0',
  '14WbfVGD9Q6vupoNDuRGyhQ-nlUJuyszZ7U7ZBqLR3tI',
  '1P_zRLAUQQR8aVQyak70-IJuQO40OhMuRbkiPfZ8Evv0',
  '1oscv66p2X8tdgK5TrX-kzxKCJJhl74ERwqw5G9-9lXA',
  '1gtEbouaCS_ZPuFrPLxSOdbE7gT8DBV_jVcuhZtGAT2k',
  '1PCiBGrCNF7BKanubKbHB6kOwzvgnKYKJOpr1Uq_eZZI',
  '1GNJMzZ1Eg8sz4_acynQ3WKwvKuSBO44qAPTSSfqmuq0',
  '1pui40aof6PQGxpC8X83UuUzkfUkzpA1jfUx3UTwKQok',
  '1PHL7W0ZfcXLJmRAbTmGy0ExSWZX3DsWkJRVYRG37Fjw',
  '1U0_8CdJC91Z0HOymT4VgNaSXDb_GQTesYzAXdn7pops',
  '1LX1bHg8LCAjBsq9Y-r0gO0PgmPm5xextHFNT3CrysYY',
  '1S8-sSxBfv2q2_pTzvvfBEtyv0Wa-Y-_NF0tdr7sLBUE',
  '1r-nO2XYd7fg-Gx1FTYCj7ZIWFO8aPRGf8Y3awcjBs2M',
  '1-NHiXgXwrAImSi8x_TtCGyCWRrNtWdISN8xZ5RXNrko',
  '1uJqPwNuKCZJbm9cy1-MojXY3fjBkYji592ROa0VJI5A',
  '11qdNJbxuG2ZXBwN_pEgy0Hi6NpqTGrRmB1pmwAnWsbA',
  '1Ak9o2kPNF2IoWGDrU8R2eAcdJYMaxaN6Y_LG0x9htms',
  '1JIzQcPB3I1d2cFFwPk9at8sQqGfTsnl5Z2LUWSg3AAw',
  '1oF2PvxtK83B-z2rT2uhNZHjdSVDv2KYKjygw7TYc-pI',
  '1r3SGmhFcPWHvtgXukjFMQQNi-vVbN587GlnUgJqJ5cg',
  '1LPUIF2vuQrj2gbIk4Yn3n2Fd4y07iIR4R37J5WEB2jo',
]

// Zilele de wellness tiroidă, câte șapte pe săptămână: 1–7 în S12, … 29–30 în S16.
function zileTiroida(de: number, pana: number, saptamana: number): Material[] {
  const rez: Material[] = []
  for (let z = de; z <= pana; z++) {
    rez.push({ titlu: `Ziua ${z}`, tip: 'document', url: doc(ZILE_TIROIDA[z - 1]), saptamana })
  }
  return rez
}

// ───────────────────────────── secțiunile pe săptămâni ─────────────────────────────

export const SECTIUNI: Sectiune[] = [
  {
    slug: 'inainte-de-start',
    numar: '0',
    titlu: 'Înainte de start',
    rezumat: 'Pașii care pregătesc tot programul: testele de la început, suplimentele, raportarea și materialele de bază.',
    deLa: 1,
    panaLa: 1,
    nota: 'Pentru materiale ai nevoie de laptop sau tabletă — pe telefon se parcurg greu.',
    grupuri: [
      {
        materiale: [
          { titlu: 'Raportarea zilnică în aplicație', descriere: 'Jurnalul zilnic din Dashboard. Acolo se văd progresul și întrebările tale; echipa îl citește săptămânal.', tip: 'pagina', url: '/dashboard' },
          { titlu: 'Testele de simptomatologie', descriere: 'Se completează acum, la start. Le reiei în săptămâna 16 și la final, ca să vezi diferența negru pe alb.', tip: 'document', url: TESTE_SIMPTOMATOLOGIE },
          { titlu: 'Suplimente pentru microbiom', descriere: 'Lista completă. Pentru Detox 21, echipa de nutriție îți spune exact ce comanzi.', tip: 'document', url: SUPLIMENTE_MICROBIOM },
          { titlu: 'Suplimente pentru tiroidă', descriere: 'Vitaminele, mineralele și suplimentele prietenoase cu tiroida.', tip: 'document', url: doc('1abH79JfZmD45VVwluyygJzb3gL9UOaHRO6hDCXUylIw') },
          { titlu: 'Raportul zilnic alimentar', descriere: 'Fișa de tipărit, pentru cine preferă hârtia.', tip: 'pdf', url: fisier('1eCZymBsfWMQSOvDQXMrKDEodqc0wJGSF') },
          { titlu: 'Materialele suport ale protocolului', descriere: 'Folderul cu ghidurile de bază ale protocolului de microbiom.', tip: 'folder', url: folder('1lXGP6buOq2pGPsu3Kv1Now1VA2SN1JTs') },
          { titlu: 'Rețetele pentru microbiom', descriere: 'Toate rețetele protocolului, într-un singur loc.', tip: 'folder', url: folder('10kE_6NTKmktFC2SfRP7NFXPqmqti9-gs') },
        ],
      },
    ],
  },
  {
    slug: 'pregatirea',
    numar: '1',
    titlu: 'Pregătirea',
    rezumat: 'Prima săptămână din Detox 21: întâlnirile de start și protocoalele care merg în paralel cu tot restul.',
    deLa: 1,
    panaLa: 1,
    intalniri: 'Prima ședință 1:1 cu mentorul sau nutriționistul și prima întâlnire de grup.',
    grupuri: [
      {
        titlu: 'De făcut săptămâna aceasta',
        materiale: [
          { titlu: 'Prima ședință 1:1', descriere: 'Cu mentorul sau nutriționistul. Legătura se stabilește pe WhatsApp.', tip: 'pas' },
          { titlu: 'Prima întâlnire de grup', descriere: 'Linkul e în pagina Întâlniri.', tip: 'pagina', url: '/intalniri' },
          { titlu: 'Primul material din înregistrări', descriere: 'Începând cu cele mai vechi.', tip: 'pagina', url: '/curs/inregistrari' },
        ],
      },
      {
        titlu: 'În paralel cu Detox 21',
        materiale: [
          { titlu: 'Protocolul de ficat', descriere: 'Sucurile, ceaiurile și smoothie-urile se adaugă pe parcursul zilei, nu în locul micului dejun din protocol. Obligatoriu la un scor peste 25 la testul de ficat.', tip: 'document', url: doc('1D-Ia8YkLRsK87ELYuhwZRAdQAleVfSrbi8O7dZKd-X8') },
          { titlu: 'Resetarea ritmului circadian — Wellness Tracker', descriere: 'Primele 30 de zile, împreună cu psihologul funcțional.', tip: 'document', url: doc('1VY4G0CVP03f9nRe0vrzVWPmWcMrk0waUkua5fxSQIWs') },
          { titlu: 'Protocolul de somn', descriere: 'Se folosește împreună cu psihologul funcțional.', tip: 'folder', url: folder('1aoE-rnM6RgMd-Ur3NGc7uymZwPhvtrvr') },
          { titlu: 'Nervul vag — Calm în 60 de secunde', descriere: 'Respirația care reeducă sistemul nervos.', tip: 'pdf', url: NERV_VAG },
        ],
      },
    ],
  },
  {
    slug: 'detox-21',
    numar: '2',
    titlu: 'Detox 21',
    rezumat: 'Protocolul de start. La final, echipa evaluează rapoartele și decide: se repetă sau se trece la Faza 1.',
    deLa: 1,
    panaLa: 3,
    grupuri: [
      {
        materiale: [
          { titlu: 'Protocolul Detox 21', descriere: 'Folderul complet: meniuri, rețete și ghidul zilnic.', tip: 'folder', url: folder('1KXKUckDsC7E-x2W52ENiTJ6jHFCy1rPq') },
          { titlu: 'Evaluarea de final', descriere: 'Echipa analizează rapoartele din aplicație și stabilește pasul următor.', tip: 'pas', saptamana: 3 },
        ],
      },
    ],
  },
  {
    slug: 'tranzitia',
    numar: '3',
    titlu: 'Tranziția',
    rezumat: 'Săptămâna dintre Detox și microbiom. Se pregătesc polifenolii fermentați și bazele pentru supe.',
    deLa: 4,
    panaLa: 4,
    nota: 'Poți mânca meniuri fie din Detox 21, fie din protocolul de microbiom.',
    grupuri: [
      {
        materiale: [
          { titlu: 'Fermentarea polifenolilor', descriere: 'Metode de fermentare pentru primii zece polifenoli din listă.', tip: 'pdf', url: fisier('1NBAxZ_Nw3d5zhj-WmDC83-8aN5fLV-kk') },
          { titlu: 'Supa vegetală — baza pentru congelator', tip: 'document', url: doc('1mQNSGXwcZDHBYDZlLrNlnCZ3m7QGyIT8-SQcnRhvr4E') },
          { titlu: 'Supa de pui — baza pentru congelator', tip: 'document', url: doc('1aVLEs4FyL6ZxpZQAtkndb3aUoBNMfc-TCkCKaeebkKY') },
          { titlu: 'Supa de vită — baza pentru congelator', tip: 'document', url: doc('1MaiOaPrAsXay7wqlvG8MpHZH4BFFLMU3Dn6mgiifQPY') },
          { titlu: 'Comandă suplimentele de microbiom', descriere: 'Dacă nu ai făcut-o deja. Faza 1 începe la o săptămână după ce sosesc.', tip: 'document', url: SUPLIMENTE_MICROBIOM },
        ],
      },
    ],
  },
  {
    slug: 'faza-1',
    numar: '4',
    titlu: 'Faza 1 — Refacerea microbiomului',
    rezumat: 'Trei săptămâni cu aderență de 100%. Scade inflamația și se reface energia.',
    deLa: 5,
    panaLa: 7,
    obiectiv: 'Reducerea inflamației și refacerea energiei. Aderență 100%.',
    intalniri: 'Trei întâlniri de grup cu mentorul.',
    grupuri: [
      {
        titlu: 'Introducere',
        materiale: [
          { titlu: 'Introducere în Faza 1', tip: 'youtube', url: 'https://www.youtube.com/watch?v=Ylv1ANmhmY4' },
          { titlu: 'Cum reduce microbiomul inflamația', tip: 'youtube', url: 'https://youtu.be/j289p6G3T_0' },
        ],
      },
      {
        titlu: 'Cursurile săptămânale',
        materiale: [
          { titlu: 'Cursul 1', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1tSbCMktmQ2naeRvKFtJSH8Z86jMHK2Z3'), saptamana: 5 },
          { titlu: 'Cursul 2', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1F8Ko2zEs0Qp09sLavN8RfyYPew-HkJsn'), saptamana: 6 },
          { titlu: 'Cursul 3', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1zKxcbdFHZss4BDprAiFLrqs9dyF3oyzl'), saptamana: 7 },
        ],
      },
      {
        titlu: 'Rețete și mișcare',
        materiale: [
          { titlu: 'Rețete Faza 1 — vegetarian', tip: 'folder', url: folder('12kx4JIFU1ev6Jl30CqTpmBMdeac16vVm') },
          { titlu: 'Rețete Faza 1 — omnivor', tip: 'folder', url: folder('1h6KDUQY5ZTdgqBXpp5tlhUfY8tYBy-xn') },
          { titlu: 'Planul de exerciții de forță', descriere: 'Trei zile pe săptămână, full body, pentru activarea miokinelor. Cu prioritate din această fază.', tip: 'pdf', url: PROGRAM_FORTA },
        ],
      },
    ],
  },
  {
    slug: 'faza-2',
    numar: '5',
    titlu: 'Faza 2 — Boost metabolic',
    rezumat: 'Patru săptămâni de accelerare a metabolismului, cu o marjă de 10% în afara listei.',
    deLa: 8,
    panaLa: 11,
    obiectiv: 'Accelerarea metabolismului. Aderență de minimum 90% — poți consuma 10% și din afara listei.',
    grupuri: [
      {
        titlu: 'Introducere',
        materiale: [{ titlu: 'Introducere în Faza 2', tip: 'youtube', url: 'https://youtu.be/DFGZyxcKOdE' }],
      },
      {
        titlu: 'Cursurile săptămânale',
        materiale: [
          { titlu: 'Cursul 4', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1mt3RriIGnvP24Nmej-c65MLEo9-mipFf'), saptamana: 8 },
          { titlu: 'Cursul 5', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1MGnJKUJoL00g2olAVoPllGsTG3lVJOD1'), saptamana: 9 },
          { titlu: 'Cursul 6', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1z1qDr9ptYoJtoqLbtbxDugSnOpiDrC16'), saptamana: 10 },
          { titlu: 'Cursul 7', descriere: 'Înregistrare audio.', tip: 'audio', url: fisier('1R72VQaB68VVWhyFXUScFfhZsJS3McyEj'), saptamana: 11 },
        ],
      },
      {
        titlu: 'Rețete',
        materiale: [
          { titlu: 'Rețete Faza 2 — vegetarian', tip: 'folder', url: folder('1nlC8dibhxjgVYettn274FNAut5rS56Aj') },
          { titlu: 'Rețete Faza 2 — omnivor', tip: 'folder', url: folder('1SFSzawIozKTTeLtayBRywvpH7lM127Xa') },
        ],
      },
    ],
  },
  {
    slug: 'faza-3',
    numar: '6',
    titlu: 'Faza 3 — Salvarea tiroidei',
    rezumat: 'Programul de 30 de zile pentru îngrijirea tiroidei: șapte cursuri video și câte o activitate pe zi.',
    deLa: 12,
    panaLa: 15,
    obiectiv: 'Îngrijirea și reechilibrarea tiroidei.',
    intalniri: 'Patru întâlniri de grup și patru întâlniri 1:1.',
    grupuri: [
      {
        titlu: 'Ghiduri',
        materiale: [
          { titlu: 'Ghidul programului Salvare Tiroidă în 30 de zile', tip: 'document', url: doc('15DBt-j8z5cI3FqeBWQ8qEHpfWcULXpRlVAcykp8GOrc') },
          { titlu: 'Analizele recomandate pentru tiroidă', tip: 'document', url: doc('1dogqpxAui6XhwT5bOazwun4p3vG2ILOv27wBo6I7N-0') },
          { titlu: 'Îngrijirea tiroidei', tip: 'youtube', url: 'https://youtu.be/vFpmYPHMTJE' },
          { titlu: 'Rețete pentru tiroidă', tip: 'folder', url: folder('107_Kol7j5WH24Br6M7llREkOay6INH8o') },
        ],
      },
      {
        titlu: 'Cursurile video',
        materiale: [
          { titlu: 'Cursul 1 — Ce este tiroida și ce face', tip: 'video', url: fisier('10zeTBxtcgHvPQOi6WiBTGlC0qwomaVdD'), saptamana: 12 },
          { titlu: 'Cursul 2 — Semnele unui dezechilibru tiroidian', descriere: 'După cursurile 1 și 2 urmează prima întâlnire de mentorare pe tiroidă.', tip: 'video', url: fisier('1LVehcvgySEwnH5ycaODkPg3nentL8MrA'), saptamana: 12 },
          { titlu: 'Cursul 3 — Conexiunea cu microbiomul', tip: 'video', url: fisier('16A-Cxeu-pUT_GDgV06D7JTPLZLUbRowZ'), saptamana: 13 },
          { titlu: 'Cursul 4 — NTIS, disfuncția tiroidiană ascunsă', descriere: 'Urmează a doua întâlnire de mentorare, pentru întrebări și răspunsuri.', tip: 'video', url: fisier('17KoAYy7Ydg5zc_GELA2k8149wUzvV5By'), saptamana: 13 },
          { titlu: 'Cursul 5 — Testare și tratament', tip: 'video', url: fisier('1TbThKVI1bnBZ141JAx2myqx_xoMfnSwD'), saptamana: 14 },
          { titlu: 'Cursul 6 — Factorii perturbatori endocrini', descriere: 'Urmează a treia întâlnire de mentorare.', tip: 'video', url: fisier('1ZRPvLFvAHP03aN_IKpWaLGvKF0AeRkMG'), saptamana: 14 },
          { titlu: 'Cursul 7 — Ce să elimini, ce să mănânci', descriere: 'Urmează a patra întâlnire de mentorare.', tip: 'video', url: fisier('1O4KrI-wb18WWMICFcrAPspRLHIRe_n8y'), saptamana: 15 },
        ],
      },
      { titlu: 'Activitățile de wellness — săptămâna 12', materiale: zileTiroida(1, 7, 12), compact: true },
      { titlu: 'Activitățile de wellness — săptămâna 13', materiale: zileTiroida(8, 14, 13), compact: true },
      { titlu: 'Activitățile de wellness — săptămâna 14', materiale: zileTiroida(15, 21, 14), compact: true },
      { titlu: 'Activitățile de wellness — săptămâna 15', materiale: zileTiroida(22, 28, 15), compact: true },
      { titlu: 'Activitățile de wellness — săptămâna 16', materiale: zileTiroida(29, 30, 16), compact: true },
    ],
  },
  {
    slug: 'evaluarea',
    numar: '7',
    titlu: 'Evaluarea',
    rezumat: 'Săptămâna 16 închide partea intensivă. Reiei testele și decizi pasul următor împreună cu echipa.',
    deLa: 16,
    panaLa: 16,
    intalniri: 'Ședință 1:1 de analiză a celor 16 săptămâni și întâlnire de grup.',
    nota: 'Dacă evaluarea nu e pozitivă, se reia protocolul de microbiom (Faza 1 sau Faza 2) și se reevaluează.',
    grupuri: [
      {
        materiale: [
          { titlu: 'Testele de simptomatologie — reevaluarea', descriere: 'Aceleași teste ca la start. Comparația arată ce s-a schimbat.', tip: 'document', url: TESTE_SIMPTOMATOLOGIE },
          { titlu: 'Decizia echipei', descriere: 'Post intermitent sau reluarea protocolului de microbiom.', tip: 'pas' },
          { titlu: 'Introducere în postul intermitent', tip: 'video', inLucru: true },
          { titlu: 'Ghidul de introducere în postul intermitent', tip: 'pdf', inLucru: true },
        ],
      },
    ],
  },
  {
    slug: 'post-intermitent',
    numar: '8',
    titlu: 'Postul intermitent',
    rezumat: 'Cinci săptămâni de post intermitent, în perioada de monitorizare. Rețete noi în fiecare săptămână.',
    deLa: 17,
    panaLa: 21,
    intalniri: 'Întâlnire de grup în fiecare săptămână; în săptămâna 21, ședință 1:1 de evaluare.',
    grupuri: [
      {
        materiale: [
          { titlu: 'Rețetele postului intermitent', descriere: 'Folderul complet, pe săptămâni.', tip: 'folder', url: FOLDER_POST_INTERMITENT },
          { titlu: 'Deserturi', tip: 'folder', url: folder('1qqctj6l8_r-4thzW7gDxrSdeXnd0MUkN'), saptamana: 21 },
        ],
      },
      {
        titlu: 'Cursurile săptămânale',
        materiale: [17, 18, 19, 20, 21].map((s, i) => ({
          titlu: `Postul intermitent — săptămâna ${i + 1}`,
          tip: 'video' as const,
          saptamana: s,
          inLucru: true,
        })),
      },
    ],
  },
  {
    slug: 'stabilizare-si-mentenanta',
    numar: '9',
    titlu: 'Stabilizare și mentenanță',
    rezumat: 'Reintroducerea alimentelor și planul tău pentru după program.',
    deLa: 22,
    panaLa: 23,
    intalniri: 'Întâlnire de grup și două ședințe 1:1 pentru planul personal.',
    grupuri: [
      {
        titlu: 'Săptămâna 22',
        materiale: [
          { titlu: 'Reintroducerea progresivă a alimentelor', tip: 'pdf', saptamana: 22, inLucru: true },
          { titlu: 'Principiile alimentare pe termen lung', tip: 'pdf', saptamana: 22, inLucru: true },
          { titlu: 'Revizuirea planului de suplimente', descriere: 'Cu echipa, dacă e nevoie.', tip: 'pas', saptamana: 22 },
        ],
      },
      {
        titlu: 'Săptămâna 23',
        materiale: [
          { titlu: 'Ghidul de mentenanță a microbiomului', tip: 'pdf', saptamana: 23, inLucru: true },
          { titlu: 'Protocolul pentru stres, vacanțe sau regres temporar', tip: 'pdf', saptamana: 23, inLucru: true },
          { titlu: 'Protocoalele bonus potrivite profilului tău', tip: 'pagina', url: '/curs/protocoale-bonus', saptamana: 23 },
          { titlu: 'Testele de simptomatologie — evaluarea finală', descriere: 'Comparația cu startul și cu săptămâna 16.', tip: 'document', url: TESTE_SIMPTOMATOLOGIE, saptamana: 23 },
          { titlu: 'Analizele de follow-up recomandate', tip: 'document', saptamana: 23, inLucru: true },
        ],
      },
    ],
  },
  {
    slug: 'absolvire',
    numar: '10',
    titlu: 'Absolvirea',
    rezumat: 'Ultima săptămână: întâlnirea de închidere și planul tău pentru următoarele șase luni.',
    deLa: 24,
    panaLa: 24,
    intalniri: 'Întâlnirea de grup de închidere și ședința 1:1 finală.',
    grupuri: [
      {
        materiale: [
          { titlu: 'Planul personal pentru următoarele 6 luni', descriere: 'Se construiește în ședința 1:1 finală.', tip: 'pas' },
          { titlu: 'Feedback pentru echipă', tip: 'pas' },
        ],
      },
    ],
  },
]

// ───────────────────────────── secțiunile extra ─────────────────────────────

const GHIDURI_PF = [
  '1h8-pW-E1MaHhpqSPaFuw-31bmcVNKdmn',
  '15e0ADRGTa1k3W1XhG7ZRbRJj6wgpzYfb',
  '1O9w4brbliSIV6mJcL7WxW9gr5zeSStMe',
  '15fHmfMTlqfaq8lU65iB6VAMQKr4jsZu6',
  '1j76h_MnPTRVXQXCIITf9mAM88pnjqO1o',
  '11XMiiuhyS0-bi7ofaIN8B_EbDCcbBqkM',
  '1Iu90aF1_8VxKcvRog55kt6iBL0po0Skk',
  '1OOaDB6LioyFElt05V-ZF-ndm40tPdV3K',
  '1LCBms5WMX_wjPqWEB44EpRcMpL_Hqyu8',
  '1RM_bl9rAqgvhIXStXYLz7nDO9_O1Xoua',
  '1tR597WeDJ0odeaqrU6NeQDHLzjuDGOWe',
  '1ECaU5nOGTg9ImN010PmhvumyixOm1KBo',
]

export const PSIHOLOGIE: Sectiune = {
  slug: 'psihologie-functionala',
  numar: '◆',
  titlu: 'Psihologie funcțională',
  rezumat: 'Douăsprezece ședințe cu psihologul funcțional, câte un ghid nou în fiecare săptămână.',
  deLa: 1,
  panaLa: 12,
  extra: true,
  grupuri: [
    {
      titlu: 'Cei 12 pași',
      materiale: GHIDURI_PF.map((id, i) => ({
        titlu: `Ghidul ${i + 1}`,
        tip: 'pdf' as const,
        url: fisier(id),
        saptamana: i + 1,
      })),
    },
    {
      titlu: 'La recomandarea psihologului',
      materiale: [
        { titlu: 'Protocolul pentru anxietate și atacuri de panică', descriere: 'Se recomandă după evaluare.', tip: 'document', url: doc('13Dd9HG-qKyXz0ARdkOWraGY2RaBz31oS3oXXCRbwENs') },
        { titlu: 'Minicurs: principii japoneze neuro-imuno-metabolice', tip: 'pdf', url: fisier('138p3CPRf68szNdSk3RU5mtvqa4kXrxLj') },
      ],
    },
  ],
}

export const BONUS: Sectiune = {
  slug: 'protocoale-bonus',
  numar: '✦',
  titlu: 'Protocoale bonus',
  rezumat: 'Protocoale suplimentare, după caz, la recomandarea echipei.',
  deLa: 1,
  panaLa: TOTAL_SAPTAMANI,
  extra: true,
  grupuri: [
    {
      materiale: [
        { titlu: 'Toate protocoalele bonus', descriere: 'Somn, stres traumatic, SIBO, ficat, deficit de fier, suprarenale, depresie, infecții, teste.', tip: 'folder', url: FOLDER_BONUS },
        { titlu: 'Ghidul ficatului — detoxifiere și energie', tip: 'pdf', url: site('2025/05/%E2%9C%85-GHID-COMPLET-%E2%80%93-TIROIDA-DETOXIFIERE-SI-ENERGIE-.pdf') },
        { titlu: 'Sănătatea circadiană — biblioteca completă', tip: 'document', url: doc('1hTv1j7u-zXN_j-tdZG9QxT1z_-UHmVYEaIyAxs8Ye-A') },
        { titlu: 'Nervul vag — Calm în 60 de secunde', tip: 'pdf', url: NERV_VAG },
      ],
    },
  ],
}

// Personalizările se deschid doar cursanților cărora echipa le-a bifat
// protocolul (profiles.protocols, cu numele din Setări → Protocoale).
export interface Personalizare {
  cheie: string
  titlu: string
  rezumat: string
  /** Fragmente din numele protocolului din Setări, fără diacritice, cu litere mici. */
  potriviri: string[]
  materiale: Material[]
}

export const PERSONALIZARI: Personalizare[] = [
  {
    cheie: 'sibo',
    titlu: 'SIBO',
    rezumat: 'Două până la patru săptămâni de protocol SIBO, după care continui cu microbiomul.',
    potriviri: ['sibo'],
    materiale: [{ titlu: 'Protocolul SIBO', descriere: 'Folderul complet.', tip: 'folder', url: folder('1kJC-6o_n2i8Yz5En84kwUwprtU3OMs7f') }],
  },
  {
    cheie: 'candidoza',
    titlu: 'Anti-candidoză',
    rezumat: 'Protocolul și rețetele anti-candidoză.',
    potriviri: ['candid'],
    materiale: [{ titlu: 'Protocolul și rețetele anti-candidoză', tip: 'folder', url: folder('1xGFTaanl5eAjND61UtS_fAwrS4MHT_5I') }],
  },
  {
    cheie: 'insulina',
    titlu: 'Rezistența la insulină',
    rezumat: 'Se parcurge de la început, în paralel cu programul.',
    potriviri: ['insulin'],
    materiale: [
      { titlu: 'Stabilizarea glicemiei și inversarea rezistenței la insulină', descriere: 'Ghidul de bază: respectă cât mai multe dintre recomandări.', tip: 'pdf', url: site('2025/07/Stabilizarea-Glicemiei-si-Inversarea-Rezistentei-la-Insulina-.pdf') },
      { titlu: 'Detalii pentru planul de scădere a rezistenței la insulină', tip: 'pdf', url: fisier('1OviXXe2eYsdCIw7XQKzk6U1pIKT58FVC') },
      { titlu: 'Programul săptămânal de exerciții', descriere: 'Trei zile pe săptămână, full body.', tip: 'pdf', url: PROGRAM_FORTA },
      { titlu: '9 semne timpurii ale rezistenței la insulină', tip: 'pagina', url: 'https://www.patreon.com/posts/9-semne-timpurii-153335949' },
      { titlu: 'Cele 6 drumuri spre rezistența la insulină', tip: 'pagina', url: 'https://www.patreon.com/posts/cele-6-drumuri-150985405' },
    ],
  },
]

// Înregistrările întâlnirilor, pe luni. Folderul rădăcină le are pe toate,
// inclusiv lunile adăugate după ultima actualizare a acestei liste.
export const INREGISTRARI_TOATE = folder('1ZoA5fULuH0tMcSousbFC0aBxI0jr413R')

export const INREGISTRARI: { an: number; luni: { luna: string; url: string }[] }[] = [
  {
    an: 2026,
    luni: [
      { luna: 'Octombrie', url: folder('1FEOYiIETsAcvnfd5vZEmw7pAIcPUOLAc') },
      { luna: 'Septembrie', url: folder('1MJzSL1Pt4ZMer004qWRDlwfDF--Pz-At') },
      { luna: 'Iulie', url: folder('1autAW8D6CuvTReFGdyfH1zwHkunbT-E5') },
      { luna: 'Iunie', url: folder('13y0lkQTmYfm--HT2iypt_fXtEplhuTB-') },
      { luna: 'Mai', url: folder('1dk-KZ6OZuXbRGeh0nt24PyXSQzT85AtY') },
      { luna: 'Aprilie', url: folder('1vVWSsZcNGLhe9_io6FAtR_tFWFYp2Dfl') },
      { luna: 'Martie', url: folder('1x_km5siI0dCoXSmpcwic9KfzmygDevEh') },
      { luna: 'Februarie', url: folder('1c38qPs6cY0Zsv1QysZGj1BBxyfGtGLDz') },
      { luna: 'Ianuarie', url: folder('1cKIBj3yHRdrJeiWaOONWrMcDH4tZ7-DC') },
    ],
  },
  {
    an: 2025,
    luni: [
      { luna: 'Decembrie', url: folder('1EPoyzTUU2Y3dMNsFPD73iUWkE4QWbqBO') },
      { luna: 'Noiembrie', url: folder('1JuNhjHGgK_nFmaKptRBnM7xpHtFiY_KK') },
      { luna: 'Octombrie', url: folder('10P2tqcISkZBVjrfQbGoN22Tw6qEqk2VK') },
      { luna: 'Septembrie', url: folder('1lynMoUmMIDYd7cvtmJCVT9pKO2VH2LTr') },
      { luna: 'August', url: folder('1F3zY9DYhbOBSO17RFJY8Td3ZO-RV7wNg') },
      { luna: 'Iulie', url: folder('1HdaEUsC2r13LUCed3Atz__BvIuUstyRa') },
      { luna: 'Iunie', url: folder('1vDjZoc70f8f5ge6Ktmxz6S1qrCERKvb6') },
      { luna: 'Mai', url: folder('1TOFH1Vm1zs3WYirLMa_NXcAVSJRbdCQM') },
      { luna: 'Aprilie', url: folder('1_lfvOuLzkFyz0_7m-TIepAxgV1bktTAI') },
      { luna: 'Martie', url: folder('14p2xGhKQeTkP-c4Iy0hVH-ihG0QzKQOx') },
      { luna: 'Februarie', url: folder('1GD7Gluw0EYVLu_P_jYZnIPp38kkZpUKv') },
      { luna: 'Ianuarie', url: folder('12J1LqO0_4R_bTbYMVQER76NbQQypRODf') },
    ],
  },
  {
    an: 2024,
    luni: [
      { luna: 'Decembrie', url: folder('1OGgxcEs43AWJI21UKkbh3zE6o8I946cB') },
      { luna: 'Noiembrie', url: folder('1M1-pE7UARO8OleSSUs-VrdW-llTNBgEd') },
      { luna: 'Octombrie', url: folder('1OGsYeC_GTkB3zCQQRCgr0sL5HT6xTTQG') },
      { luna: 'Septembrie', url: folder('1ml7CBaN4LRWZqF6FTzh1ULxjfAvMHvRl') },
      { luna: 'August', url: folder('1LwjeqSHoncklkNky1Fjbn5wDhEFSfEsb') },
      { luna: 'Iulie', url: folder('1gMMWrJL7izYQqQbzGzirChsQZrYhT8wR') },
      { luna: 'Iunie', url: folder('1jjcAPuooVrtXtP-W3Vj0O1jG8xrsgeMu') },
      { luna: 'Mai', url: folder('1VVsIqD7u9ottDDPwurjdC3eDqf1W3lIv') },
      { luna: 'Aprilie', url: folder('14I2WwyuNKBnBJxfasSR94siIr6UTkS7z') },
      { luna: 'Martie', url: folder('1hhR6vbhD9asLpD9Mdg8O5iuSNeXc8tSJ') },
      { luna: 'Februarie', url: folder('15v-m-78jnwOm7dAvNugQRy9AZcacLjqi') },
      { luna: 'Ianuarie', url: folder('1W2QxlRXlyT1YvrV3yPDuQMbWQZsC6uP-') },
    ],
  },
]

// ───────────────────────────── reguli ─────────────────────────────

/** Secțiunea în care se află cursantul acum (cea mai recentă începută și neîncheiată). */
export function sectiuneaCurenta(saptamana: number): Sectiune {
  const inCurs = SECTIUNI.filter(s => s.deLa <= saptamana && s.panaLa >= saptamana)
  if (inCurs.length) return inCurs[inCurs.length - 1]
  const incepute = SECTIUNI.filter(s => s.deLa <= saptamana)
  return incepute[incepute.length - 1] ?? SECTIUNI[0]
}

export function sectiuneDeschisa(s: Sectiune, saptamana: number, admin: boolean): boolean {
  return admin || !BLOCARE_PE_SAPTAMANI || s.deLa <= saptamana
}

export function saptamanaMaterialului(m: Material, s: Sectiune): number {
  return m.saptamana ?? s.deLa
}

export function materialDeschis(m: Material, s: Sectiune, saptamana: number, admin: boolean): boolean {
  if (m.inLucru) return false
  if (admin || !BLOCARE_PE_SAPTAMANI) return true
  return saptamanaMaterialului(m, s) <= saptamana
}

function faraDiacritice(t: string) {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function personalizareActiva(p: Personalizare, protocoale: string[]): boolean {
  const nume = protocoale.map(faraDiacritice)
  return p.potriviri.some(f => nume.some(n => n.includes(f)))
}

export function gasesteSectiunea(slug: string): Sectiune | undefined {
  return [...SECTIUNI, PSIHOLOGIE, BONUS].find(s => s.slug === slug)
}

export function etichetaSaptamani(s: Sectiune): string {
  if (s.slug === BONUS.slug) return 'Pe tot parcursul programului'
  return s.deLa === s.panaLa ? `Săptămâna ${s.deLa}` : `Săptămânile ${s.deLa}–${s.panaLa}`
}

/** Materialele care se deschid exact în săptămâna dată, din toate secțiunile. */
export function materialeleSaptamanii(saptamana: number): { sectiune: Sectiune; material: Material }[] {
  const rez: { sectiune: Sectiune; material: Material }[] = []
  for (const s of [...SECTIUNI, PSIHOLOGIE]) {
    for (const g of s.grupuri) {
      for (const m of g.materiale) {
        if (!m.inLucru && m.url && saptamanaMaterialului(m, s) === saptamana) {
          rez.push({ sectiune: s, material: m })
        }
      }
    }
  }
  return rez
}

export function esteExtern(url: string): boolean {
  return /^https?:\/\//.test(url)
}
