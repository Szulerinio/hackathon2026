import type { Metadata } from 'next'
import { Syne, Instrument_Sans } from 'next/font/google'
import './globals.css'
import Nav from './nav'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '500', '600', '700'],
})

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  title: 'RafalCRM',
  description: 'Personal CRM for Rafał',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${instrumentSans.variable}`}>
      <body>
        <div className="shell">
          <Nav />
          <main className="main-area">{children}</main>
        </div>
      </body>
    </html>
  )
}
