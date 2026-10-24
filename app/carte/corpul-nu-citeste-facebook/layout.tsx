// Layout comun pentru paginile cărții (prezentare, mulțumim, termeni).
// Aici, și numai aici, rulează pixelul Meta cu bannerul de acord
// și transmiterea etichetelor UTM către plata Stripe.
import MetaPixelCarte from '@/components/analytics/MetaPixelCarte'
import UtmStripeCarte from '@/components/analytics/UtmStripeCarte'

export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <MetaPixelCarte />
      <UtmStripeCarte />
    </>
  )
}
