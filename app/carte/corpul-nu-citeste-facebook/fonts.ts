import localFont from 'next/font/local'

// Fonturile identității IC, servite local (fără apel la Google la încărcare).
export const serif = localFont({
  src: [
    { path: './fonts/Cormorant-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Cormorant-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
})

export const sans = localFont({
  src: [
    { path: './fonts/Manrope-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Manrope-600-normal.woff2', weight: '600', style: 'normal' },
    { path: './fonts/Manrope-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})
