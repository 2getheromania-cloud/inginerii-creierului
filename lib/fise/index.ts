// Fișele programului, ca module TypeScript.
//
// Nu stau în public/: ar fi accesibile fără autentificare, iar unsprezece din
// douăsprezece se dau numai pe treapta cu instrumente. Pagina care le afișează
// verifică întâi accesul în baza de date, prin RLS, și abia apoi randează.
//
// Nu se citesc nici de pe disc cu fs: pe Vercel urmărirea fișierelor nu le-ar
// include în pachetul funcției, iar pagina ar cădea abia în producție.
import * as jurnal_energie from './jurnal-energie'
import * as checklist_mediu from './checklist-mediu'
import * as plan_21_zile from './plan-21-zile'
import * as pfi_simplificat from './pfi-simplificat'
import * as lista_analize from './lista-analize'
import * as ritm_14_zile from './ritm-14-zile'
import * as ace_reglare from './ace-reglare'
import * as convingeri from './convingeri'
import * as genograma from './genograma'
import * as valori_ritual from './valori-ritual'
import * as plan_6_luni from './plan-6-luni'

export type Fisa = { titlu: string; corp: string }

export const FISE: Record<string, Fisa> = {
  'jurnal-energie': { titlu: jurnal_energie.titlu, corp: jurnal_energie.corp },
  'checklist-mediu': { titlu: checklist_mediu.titlu, corp: checklist_mediu.corp },
  'plan-21-zile': { titlu: plan_21_zile.titlu, corp: plan_21_zile.corp },
  'pfi-simplificat': { titlu: pfi_simplificat.titlu, corp: pfi_simplificat.corp },
  'lista-analize': { titlu: lista_analize.titlu, corp: lista_analize.corp },
  'ritm-14-zile': { titlu: ritm_14_zile.titlu, corp: ritm_14_zile.corp },
  'ace-reglare': { titlu: ace_reglare.titlu, corp: ace_reglare.corp },
  'convingeri': { titlu: convingeri.titlu, corp: convingeri.corp },
  'genograma': { titlu: genograma.titlu, corp: genograma.corp },
  'valori-ritual': { titlu: valori_ritual.titlu, corp: valori_ritual.corp },
  'plan-6-luni': { titlu: plan_6_luni.titlu, corp: plan_6_luni.corp },
}

export function getFisa(slug: string): Fisa | null {
  return FISE[slug] ?? null
}

/**
 * Fișa fără banda ei verde de antet.
 *
 * Pe hârtie antetul e util: spune a cui e foaia și din ce modul. Pe ecran,
 * înăuntrul aplicației, ar fi al doilea antet sub cel al programului. Varianta
 * de tipărit, servită de ruta /tiparire, îl păstrează întreg.
 */
export function faraAntet(corp: string): string {
  return corp.replace(/<header class="head">[\s\S]*?<\/header>/, '').trim()
}
