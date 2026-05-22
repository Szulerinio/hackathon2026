import Link from 'next/link'
import { getContacts, getDeals, getListings } from '../../lib/crm'
import AddDealModal from './add-deal-modal'
import EditDealModal from './edit-deal-modal'

function statusPill(status: string) {
  if (status === 'viewing') return 's-blue'
  if (status === 'offer') return 's-amber'
  if (status === 'negotiation') return 's-red'
  if (status === 'closed') return 's-green'
  return 's-dim'
}

const ACTIVE_STATUSES = ['viewing', 'offer', 'negotiation']

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const [allDeals, contacts, listings] = await Promise.all([
    getDeals(),
    getContacts(),
    getListings(),
  ])
  const { filter } = await searchParams
  const isFiltered = filter === 'active'
  const deals = isFiltered ? allDeals.filter(d => ACTIVE_STATUSES.includes(d.status)) : allDeals
  const activeCount = allDeals.filter(d => ACTIVE_STATUSES.includes(d.status)).length
  const buyers = contacts
    .map((c) => ({ slug: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const listingOptions = listings
    .map((l) => ({ id: l.id, address: l.address }))
    .sort((a, b) => a.address.localeCompare(b.address))

  return (
    <>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Deals</div>
          <div className="page-sub">{activeCount} active · {allDeals.length} total</div>
        </div>
        <AddDealModal buyers={buyers} listings={listingOptions} />
      </div>

      {isFiltered && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 4,
            background: 'rgba(200,241,53,0.08)',
            color: 'var(--accent-dim)',
            border: '1px solid rgba(200,241,53,0.2)',
          }}>
            Active only
          </span>
          <Link href="/deals" style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>
      )}

      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 100px 120px 90px 72px',
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
          <div />
        </div>

        {deals.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 100px 120px 90px 72px',
              gap: 8,
              padding: '12px 16px',
              borderBottom: i < deals.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}
          >
            <Link
              href={`/contacts/${d.buyerSlug}`}
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}
            >
              {d.buyerName}
            </Link>
            <Link
              href={`/deals/${d.id}`}
              style={{ fontSize: 12, color: 'var(--text2)', textDecoration: 'none' }}
            >
              {d.propertyAddress}
            </Link>
            <span className={`s-pill ${statusPill(d.status)}`}>{d.status}</span>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-dim)' }}>{d.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{d.lastActivityDate}</div>
            <EditDealModal deal={d} buyers={buyers} listings={listingOptions} />
          </div>
        ))}
      </div>
    </>
  )
}
