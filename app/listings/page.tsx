import Link from 'next/link'
import { LISTINGS } from '../../lib/mock-data'
import { slugify } from '../../lib/data'

function statusPill(status: string) {
  if (status === 'active') return 's-green'
  if (status === 'sold') return 's-blue'
  return 's-dim'
}

const activeCount = LISTINGS.filter(l => l.status === 'active').length

export default function ListingsPage() {
  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Listings</div>
          <div className="page-sub">{activeCount} active · {LISTINGS.length} total</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {LISTINGS.map(l => (
          <div
            key={l.id}
            className="panel"
            style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            {/* Photo placeholder */}
            <div style={{
              background: 'var(--surface3)',
              borderRadius: 'var(--r-sm)',
              height: 110,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text3)',
              fontSize: 11,
              letterSpacing: '0.05em',
            }}>
              PHOTO
            </div>

            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  {l.address}
                </div>
                <span className={`s-pill ${statusPill(l.status)}`} style={{ flexShrink: 0, marginTop: 1 }}>
                  {l.status}
                </span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dim)' }}>
                {l.price}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Seller:{' '}
                  <Link
                    href={`/contacts/${slugify(l.sellerName)}`}
                    style={{ color: 'var(--text2)', textDecoration: 'none', fontWeight: 500 }}
                  >
                    {l.sellerName}
                  </Link>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {l.daysOnMarket}d on market
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
