import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Cinzel, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Sacred typefaces for the Healing surface. Cinzel carries the ritual labels
// and titles; Cormorant Garamond carries the guidance body (incl. italics).
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--f-cinzel',
})
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--f-cormorant',
})

export const metadata: Metadata = {
  title: 'The Field Perceptionist presents — The Beautiful Necessity',
  description:
    'The Beautiful Necessity: a living field rendered as physics — a Fibonacci lattice on the golden angle, Cauchy dispersion, Rodrigues rotation, and POV persistence. Seeing the field. Feeling the field. Being the field.',
  // Icons are provided by the file-based convention: app/icon.png (the mandala)
  // and app/apple-icon.png. No explicit `icons` block so nothing overrides them.
}

// `viewportFit: 'cover'` is what makes env(safe-area-inset-*) resolve to real
// values — without it the bottom sheet's close control ends up underneath the
// phone's home indicator / browser toolbar and becomes untappable.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cormorant.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
