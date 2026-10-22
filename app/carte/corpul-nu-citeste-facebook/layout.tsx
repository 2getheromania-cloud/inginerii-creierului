// Layout comun pentru paginile cărții (prezentare, mulțumim, termeni).
// Aici, și numai aici, rulează pixelul Meta cu bannerul de acord.
import MetaPixelCarte from '@/components/analytics/MetaPixelCarte'

export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MetaPixelCarte />
    </>
  )
}
