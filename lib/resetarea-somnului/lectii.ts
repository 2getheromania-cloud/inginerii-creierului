// Textul lecțiilor, pe slug-ul modulului din bază.
//
// Nu stă în public/: lecțiile se dau numai celor înscriși, iar pagina verifică
// întâi, prin RLS, că modulul s-a deschis pentru omul acesta.
import { bazele, ceasul, alimentatia, hormonii } from './lectii-1'
import { mediul, miscarea, unelte, reset, consolidare } from './lectii-2'

export const LECTII: Record<string, string> = {
  'bazele-somnului': bazele,
  'ceasul-biologic': ceasul,
  'alimentatie-intestin': alimentatia,
  'hormonii-somnului': hormonii,
  'mediul-de-somn': mediul,
  'miscare-stres': miscarea,
  'unelte-suplimente': unelte,
  'sleep-reset': reset,
  consolidare,
}
