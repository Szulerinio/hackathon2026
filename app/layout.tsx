import type { Metadata } from 'next'
import { Syne, Instrument_Sans } from 'next/font/google'
import './globals.css'
import Nav from './nav'
import { getActiveAlertCount } from '../lib/crm'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const alertCount = await getActiveAlertCount()

  return (
    <html lang="en" className={`${syne.variable} ${instrumentSans.variable}`}>
      <body>
        <div className="shell">
          <Nav alertCount={alertCount} />
          <main className="main-area">{children}</main>
        </div>
      </body>
    </html>
  )
}
