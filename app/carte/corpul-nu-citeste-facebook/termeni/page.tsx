import { redirect } from 'next/navigation'

// Termenii cărții sunt acum o secțiune a termenilor generali.
export default function TermeniCarte() {
  redirect('/termeni')
}
