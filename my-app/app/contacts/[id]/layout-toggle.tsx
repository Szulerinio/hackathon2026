'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const LAYOUTS = [
  { key: 'a', label: 'A · Two-col' },
  { key: 'b', label: 'B · Stack' },
  { key: 'c', label: 'C · Tabs' },
  { key: 'd', label: 'D · Briefing' },
]

export default function LayoutToggle({ contactId }: { contactId: string }) {
  const searchParams = useSearchParams()
  const current = searchParams.get('layout') ?? 'a'

  return (
    <div className="layout-toggle">
      {LAYOUTS.map(l => (
        <Link
          key={l.key}
          href={`/contacts/${contactId}?layout=${l.key}`}
          className={`ltbtn${current === l.key ? ' active' : ''}`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}
