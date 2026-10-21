// Cărțile vândute prin Stripe și livrate prin /download/[token].
// Fișierele stau în bucket-ul privat Supabase „carti”.

export type BookFile = { path: string; downloadName: string; label: string }

export type Book = {
  slug: string
  title: string
  files: Record<string, BookFile> // cheia = formatul (?f=pdf, ?f=epub)
  defaultFormat: string
  maxDownloads: number
}

export const BOOKS: Record<string, Book> = {
  'noroi-pe-sandalele-sfintilor': {
    slug: 'noroi-pe-sandalele-sfintilor',
    title: 'Noroi pe sandalele sfinților',
    files: {
      pdf: {
        path: 'Noroi_pe_sandalele_sfintilor_ONLINE.pdf',
        downloadName: 'Noroi pe sandalele sfintilor.pdf',
        label: 'PDF',
      },
    },
    defaultFormat: 'pdf',
    maxDownloads: 5,
  },
  'corpul-nu-citeste-facebook': {
    slug: 'corpul-nu-citeste-facebook',
    title: 'Corpul nu citește Facebook',
    files: {
      pdf: {
        path: 'Corpul_nu_citeste_Facebook.pdf',
        downloadName: 'Corpul nu citeste Facebook - Alin Ispas.pdf',
        label: 'PDF',
      },
      epub: {
        path: 'Corpul_nu_citeste_Facebook.epub',
        downloadName: 'Corpul nu citeste Facebook - Alin Ispas.epub',
        label: 'EPUB',
      },
    },
    defaultFormat: 'pdf',
    // Două formate pe același link: lăsăm loc pentru ambele, pe mai multe dispozitive.
    maxDownloads: 10,
  },
}

export const DEFAULT_BOOK_SLUG = 'noroi-pe-sandalele-sfintilor'

// Linkul Stripe Payment Link pentru „Corpul nu citește Facebook” (99 lei).
// Se completează după ce linkul e creat în Stripe Dashboard.
export const CNCF_PAYMENT_LINK = 'https://buy.stripe.com/bJe6oG2XP0M666ScT05gc0k'

// Recunoaște produsul după nume, fără diacritice și majuscule.
export function isCorpulNuCitesteFacebook(productName: string) {
  const normalized = productName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
  return normalized.includes('CORPUL NU CITESTE FACEBOOK')
}
