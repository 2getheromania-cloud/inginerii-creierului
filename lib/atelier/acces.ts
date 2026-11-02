// Cine are acces la „Atelierul de luni" (tab-ul din meniu, pagina și conținutul).
// Comparația se face pe emailul contului, fără majuscule.
export const ATELIER_EMAILS: readonly string[] = ['2getheromania@gmail.com']

export function areAccesLaAtelier(email: string | null | undefined): boolean {
  return !!email && ATELIER_EMAILS.includes(email.trim().toLowerCase())
}
