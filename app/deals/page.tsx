import Link from 'next/link'
import { getContacts, getDeals, getListings } from '../../lib/crm'
import AddDealModal from './add-deal-modal'
import DealsView from './deals-view'

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

      <DealsView deals={deals} buyers={buyers} listings={listingOptions} />
    </>
  )
}
