import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'The Field Perceptionist presents — The Beautiful Necessity',
  description:
    'The Beautiful Necessity: a living field rendered as physics — a Fibonacci lattice on the golden angle, Cauchy dispersion, Rodrigues rotation, and POV persistence. Seeing the field. Feeling the field. Being the field.',
  // Icons are provided by the file-based convention: app/icon.png (the mandala)
  // and app/apple-icon.png. No explicit `icons` block so nothing overrides them.
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
