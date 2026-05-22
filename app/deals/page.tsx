import Link from 'next/link'
import { DEALS } from '../../lib/mock-data'
import { slugify } from '../../lib/data'

function statusPill(status: string) {
  if (status === 'viewing') return 's-blue'
  if (status === 'offer') return 's-amber'
  if (status === 'negotiation') return 's-red'
  if (status === 'closed') return 's-green'
  return 's-dim'
}

const activeCount = DEALS.filter(d => ['viewing', 'offer', 'negotiation'].includes(d.status)).length

export default function DealsPage() {
  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Deals</div>
          <div className="page-sub">{activeCount} active · {DEALS.length} total</div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 100px 120px 90px',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
        }}>
          <div>Buyer</div>
          <div>Property</div>
          <div>Status</div>
          <div>Value</div>
          <div>Last activity</div>
        </div>

        {DEALS.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 100px 120px 90px',
              gap: 8,
              padding: '12px 16px',
              borderBottom: i < DEALS.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}
          >
            <Link
              href={`/contacts/${slugify(d.buyerName)}`}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
            >
              {d.buyerName}
            </Link>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{d.propertyAddress}</div>
            <span className={`s-pill ${statusPill(d.status)}`}>{d.status}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-dim)' }}>{d.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.lastActivityDate}</div>
          </div>
        ))}
      </div>
    </>
  )
}
