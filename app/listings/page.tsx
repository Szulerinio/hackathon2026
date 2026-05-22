import Link from 'next/link'
import { getContacts, getListings } from '../../lib/crm'
import AddListingModal from './add-listing-modal'
import EditListingModal from './edit-listing-modal'

function statusPill(status: string) {
  if (status === 'active') return 's-green'
  if (status === 'sold') return 's-blue'
  return 's-dim'
}

export default async function ListingsPage() {
  const [listings, contacts] = await Promise.all([getListings(), getContacts()])
  const activeCount = listings.filter(l => l.status === 'active').length
  const sellers = contacts
    .map((c) => ({ slug: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Listings</div>
          <div className="page-sub">{activeCount} active · {listings.length} total</div>
        </div>
        <AddListingModal sellers={sellers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {listings.map(l => (
          <div
            key={l.id}
            className="panel"
            style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  {l.address}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span className={`s-pill ${statusPill(l.status)}`} style={{ marginTop: 1 }}>
                    {l.status}
                  </span>
                  <EditListingModal listing={l} sellers={sellers} />
                </div>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dim)' }}>
                {l.price}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Seller:{' '}
                  <Link
                    href={`/contacts/${l.sellerSlug}`}
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
