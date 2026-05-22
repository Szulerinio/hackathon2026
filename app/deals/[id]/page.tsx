import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDeal, getActivitiesForDeal, getContacts } from '../../../lib/crm'
import EditDealModal from '../edit-deal-modal'
import DealActivityLog from './deal-activity-log'
import { getListings } from '../../../lib/crm'

function statusPill(status: string) {
  if (status === 'viewing') return 's-blue'
  if (status === 'offer') return 's-amber'
  if (status === 'negotiation') return 's-red'
  if (status === 'closed') return 's-green'
  return 's-dim'
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dealId = Number(id)
  if (isNaN(dealId)) notFound()

  const [deal, activities, contacts, listings] = await Promise.all([
    getDeal(dealId),
    getActivitiesForDeal(dealId),
    getContacts(),
    getListings(),
  ])

  if (!deal) notFound()

  const buyers = contacts
    .map((c) => ({ slug: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const listingOptions = listings
    .map((l) => ({ id: l.id, address: l.address }))
    .sort((a, b) => a.address.localeCompare(b.address))

  const contactOptions = contacts
    .map((c) => ({ slug: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <Link
          href="/deals"
          style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}
        >
          ← Deals
        </Link>
        <EditDealModal deal={deal} buyers={buyers} listings={listingOptions} />
      </div>

      <div className="panel fade-up" style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 4,
              }}
            >
              {deal.propertyAddress}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {deal.buyerSlug ? (
                <Link
                  href={`/contacts/${deal.buyerSlug}`}
                  style={{
                    fontSize: 13,
                    color: 'var(--text2)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  {deal.buyerName}
                </Link>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                  No buyer
                </span>
              )}
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent-dim)',
                }}
              >
                {deal.value}
              </span>
              {deal.lastActivityDate && (
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                  Last activity {deal.lastActivityDate}
                </span>
              )}
            </div>
          </div>
          <span className={`s-pill ${statusPill(deal.status)}`}>
            {deal.status}
          </span>
        </div>
      </div>

      <DealActivityLog
        dealId={dealId}
        activities={activities}
        contacts={contactOptions}
      />
    </>
  )
}
