// Planul pe 21 de zile: obiceiurile, ziua în care intră fiecare și testul.
//
// Obiceiurile se adună, nu se înlocuiesc: ce ai început în ziua 2 rămâne și
// în ziua 3. În Sleep Reset (zilele 8–17) sunt toate odată.
//
// Au intrat în plan doar măsurile cu dovadă la om (trepta 3 sau mai sus pe
// scara IC). Ce e doar ipoteză sau vine din studii pe animale e explicat în
// lecții, dar nu e bifă de zi.

export type Obicei = {
  id: string
  /** Ce faci, scris așa încât să se poată bifa. */
  text: string
  /** Ziua din care intră în plan. */
  din: number
  /** Modulul care îl explică. */
  modul: string
}

export const OBICEIURI: Obicei[] = [
  { id: 'lista',      din: 1, modul: 'bazele-somnului',      text: 'Seara, 5 minute: lista de mâine pe hârtie' },
  { id: 'respiratie', din: 1, modul: 'bazele-somnului',      text: '5 minute de respirație lentă în pat' },
  { id: 'trezire',    din: 2, modul: 'ceasul-biologic',      text: 'M-am trezit la ora fixă (± 30 de minute)' },
  { id: 'lumina',     din: 2, modul: 'ceasul-biologic',      text: '10–20 de minute afară, în prima oră după trezire' },
  { id: 'cafea',      din: 2, modul: 'ceasul-biologic',      text: 'Ultima cafea înainte de ora 14:00' },
  { id: 'cina',       din: 3, modul: 'alimentatie-intestin', text: 'Cina cu cel puțin 2–3 ore înainte de culcare' },
  { id: 'alcool',     din: 4, modul: 'hormonii-somnului',    text: 'Fără alcool în seara asta' },
  { id: 'dormitor',   din: 5, modul: 'mediul-de-somn',       text: 'Dormitor întunecat și răcoros, telefonul în altă cameră' },
  { id: 'miscare',    din: 6, modul: 'miscare-stres',        text: '20 de minute de mișcare, ideal afară' },
  { id: 'liniste',    din: 6, modul: 'miscare-stres',        text: '10 minute de liniște seara (meditație sau rugăciune)' },
  { id: 'ecrane',     din: 7, modul: 'unelte-suplimente',    text: 'Ecranele oprite cu o oră înainte de culcare' },
]

export type Zi = {
  zi: number
  etapa: 'lectii' | 'reset' | 'consolidare'
  /** Slug-ul modulului de citit azi, dacă e unul. */
  modul: string | null
  titlu: string
  /** O singură frază: ce e nou azi. */
  nou: string
  /** Testul de somn se face azi. */
  test: boolean
}

const LECTII: [string, string, string][] = [
  ['bazele-somnului',      'Bazele somnului',          'Faci testul de pornire și scrii prima listă de mâine.'],
  ['ceasul-biologic',      'Ceasul biologic',          'Alegi ora de trezire și ieși la lumină dimineața.'],
  ['alimentatie-intestin', 'Alimentație și intestin',  'Muți cina mai devreme.'],
  ['hormonii-somnului',    'Hormonii somnului',        'O seară fără alcool. Și mâine la fel.'],
  ['mediul-de-somn',       'Mediul de somn',           'Telefonul doarme în altă cameră.'],
  ['miscare-stres',        'Mișcare și stres',         'Douăzeci de minute de mers și zece de liniște.'],
  ['unelte-suplimente',    'Unelte și suplimente',     'Ecranele se sting cu o oră înainte.'],
]

export const ZILE: Zi[] = Array.from({ length: 21 }, (_, i) => {
  const zi = i + 1
  if (zi <= 7) {
    const [modul, titlu, nou] = LECTII[i]
    return { zi, etapa: 'lectii', modul, titlu, nou, test: zi === 1 }
  }
  if (zi <= 17) {
    return {
      zi,
      etapa: 'reset',
      modul: zi === 8 ? 'sleep-reset' : null,
      titlu: `Sleep Reset · ziua ${zi - 7} din 10`,
      nou:
        zi === 8
          ? 'Toate obiceiurile, împreună, după programul zilnic.'
          : 'Același program ca ieri. Repetiția e intervenția.',
      test: false,
    }
  }
  return {
    zi,
    etapa: 'consolidare',
    modul: zi === 18 ? 'consolidare' : null,
    titlu: `Consolidare · ziua ${zi - 17} din 4`,
    nou:
      zi === 21
        ? 'Refaci testul de somn și îl compari cu ziua 1.'
        : 'Alegi ce rămâne după program.',
    test: zi === 21,
  }
})

export function obiceiuriPentru(zi: number): Obicei[] {
  return OBICEIURI.filter(o => o.din <= zi)
}

// ───────────────────────── jurnalul ─────────────────────────

/** Ce se salvează pe zi. Doar cifre și bife, nimic scris de mână. */
export type IntrareZi = {
  b?: string[]
  /** Cum am dormit azi-noapte, 1–5. */
  somn?: number
  /** Energia de azi, 1–5. */
  energie?: number
  /** Ora trezirii, HH:MM. */
  trezire?: string
}

export type DateJurnal = { zile?: Record<string, IntrareZi> }

// ───────────────────────── testul ─────────────────────────
// Instrumentul din Ghidul Somnului. E un instrument de urmărire, nu un test
// validat științific: arată dacă te miști, nu pune un diagnostic.
//
// În ghid, praguri de 0–10 / 11–30 / 31–50 / 51+ pe un test care are maximum
// 50. Pragurile de mai jos sunt reîmpărțite pe 0–50, ca fiecare scor să
// cadă undeva.

export const INTREBARI_TEST = [
  'Am nevoie de cafea ca să mă trezesc.',
  'Mă simt încețoșat(ă) ore bune după ce mă trezesc.',
  'Nu m-am trezit odihnit(ă).',
  'Mi-a fost greu să adorm.',
  'Gândurile anxioase nu m-au lăsat să dorm.',
  'M-am simțit „obosit(ă), dar agitat(ă)”.',
  'M-am trezit des în timpul nopții.',
  'Am avut o cădere de energie în timpul zilei.',
  'Am ochii uscați sau grei.',
  'Am fost iritabil(ă) sau hipersensibil(ă).',
]

export type Incercare = { data: string; scor: number; r: number[] }
export type DateTest = { incercari?: Incercare[] }

export function interpretare(scor: number): { titlu: string; text: string } {
  if (scor <= 10)
    return { titlu: 'Dormi bine', text: 'Programul te ajută să păstrezi ce ai.' }
  if (scor <= 20)
    return { titlu: 'Pe drumul cel bun', text: 'Câteva ajustări fac diferența.' }
  if (scor <= 35)
    return {
      titlu: 'Probleme semnificative',
      text: 'E momentul pentru acțiune. Ia obiceiurile pe rând, cum vin în program.',
    }
  return {
    titlu: 'Somnul tău cere atenție acum',
    text:
      'Urmează programul și, dacă problemele durează de peste trei luni, discută cu medicul: există tratamente cu dovadă solidă.',
  }
}
