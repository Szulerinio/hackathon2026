'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { DealRow as DealRowType } from '../../lib/crm'
import EditDealModal from './edit-deal-modal'

function statusPill(status: string) {
  if (status === 'potential') return 's-dim'
  if (status === 'viewing') return 's-blue'
  if (status === 'offer') return 's-amber'
  if (status === 'negotiation') return 's-red'
  if (status === 'closed') return 's-green'
  return 's-dim'
}

type Props = {
  deal: DealRowType
  buyers: { slug: string; name: string }[]
  listings: { id: number; address: string }[]
  isLast: boolean
}

export default function DealRow({ deal, buyers, listings, isLast }: Props) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(`/deals/${deal.id}`)}
      className="deal-grid-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1.2fr 1fr 110px 100px 48px',
        gap: 8,
        padding: '12px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
    >
      <Link
        href={`/contacts/${deal.buyerSlug}`}
        onClick={e => e.stopPropagation()}
        style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
      >
        {deal.buyerName}
      </Link>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>
        {deal.propertyAddress}
      </span>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-dim)' }}>{deal.value}</div>
      <span className={`s-pill ${statusPill(deal.status)}`}>{deal.status}</span>
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{deal.lastActivityDate}</div>
      <div onClick={e => e.stopPropagation()}>
        <EditDealModal deal={deal} buyers={buyers} listings={listings} />
      </div>
    </div>
  )
}
