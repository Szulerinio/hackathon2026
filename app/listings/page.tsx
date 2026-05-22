import Image from 'next/image'
import Link from 'next/link'
import { getContacts, getListings } from '../../lib/crm'
import AddListingModal from './add-listing-modal'
import EditListingModal from './edit-listing-modal'

function statusPill(status: string) {
  if (status === 'active') return 's-green'
  if (status === 'sold') return 's-blue'
  return 's-dim'
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const [allListings, contacts] = await Promise.all([getListings(), getContacts()])
  const { filter } = await searchParams
  const isFiltered = filter === 'active'
  const listings = isFiltered ? allListings.filter(l => l.status === 'active') : allListings
  const activeCount = allListings.filter(l => l.status === 'active').length
  const sellers = contacts
    .map((c) => ({ slug: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Listings</div>
          <div className="page-sub">{activeCount} active · {allListings.length} total</div>
        </div>
        <AddListingModal sellers={sellers} />
      </div>

      {isFiltered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(20,120,58,0.12)',
            color: 'var(--green)',
            border: '1px solid rgba(20,120,58,0.2)',
          }}>
            Active only
          </span>
          <Link href="/listings" style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {listings.map(l => (
          <div
            key={l.id}
            className="panel"
            style={{ cursor: 'default', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ borderRadius: 'var(--r-sm)', height: 160, overflow: 'visible', position: 'relative', flexShrink: 0 }}>
              {l.photoUrl ? (
                <div style={{ borderRadius: 'var(--r-sm)', overflow: 'hidden', position: 'absolute', inset: 0 }}>
                  <Image
                    src={l.photoUrl}
                    alt={l.address}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 'var(--r-sm)',
                  background: 'linear-gradient(135deg, var(--surface2) 0%, var(--surface3) 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 6, color: 'var(--text3)',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  <span style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>No photo</span>
                </div>
              )}
              <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10 }}>
                <EditListingModal listing={l} sellers={sellers} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
                  {l.address}
                </div>
                <span className={`s-pill ${statusPill(l.status)}`} style={{ marginTop: 1 }}>
                  {l.status}
                </span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-dim)' }}>
                {l.price}
              </div>

              {l.description ? (
                <p style={{
                  fontSize: 12,
                  color: 'var(--text2)',
                  lineHeight: 1.55,
                  margin: 0,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {l.description}
                </p>
              ) : null}

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

              <div style={{
                display: 'flex',
                gap: 6,
                paddingTop: 6,
                borderTop: '1px solid var(--border)',
              }}>
                {[
                  { label: 'Looked', count: l.leads.looked, color: 'var(--blue)' },
                  { label: 'Interested', count: l.leads.interested, color: 'var(--amber)' },
                  { label: 'Called', count: l.leads.called, color: 'var(--green)' },
                ].map(({ label, count, color }) => (
                  <div key={label} style={{
                    flex: 1,
                    background: 'var(--surface2)',
                    borderRadius: 6,
                    padding: '5px 8px',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: count > 0 ? color : 'var(--text3)' }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text3)', marginTop: 1 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
