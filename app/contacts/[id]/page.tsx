import Link from 'next/link'
import { notFound } from 'next/navigation'
import { avatarClass } from '../../../lib/avatar'
import {
  getContact,
  getDealsForContact,
  getListingsForContact,
} from '../../../lib/crm'

function DecayPill({ tier, days }: { tier: string; days: number }) {
  const cls = tier === 'urgent' ? 's-red' : tier === 'warning' ? 's-amber' : tier === 'watch' ? 's-blue' : 's-green'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <span className={`s-pill ${cls}`}>{tier}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{days}d since contact</span>
    </div>
  )
}

function listingStatusPill(status: string) {
  if (status === 'active') return 's-green'
  if (status === 'sold') return 's-blue'
  return 's-dim'
}

function dealStatusPill(status: string) {
  if (status === 'viewing') return 's-blue'
  if (status === 'offer') return 's-amber'
  if (status === 'negotiation') return 's-red'
  if (status === 'closed') return 's-green'
  return 's-dim'
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getContact(id)
  if (!contact) notFound()

  const avClass = avatarClass(contact.id)
  const [linkedListings, linkedDeals] = await Promise.all([
    getListingsForContact(contact.id),
    getDealsForContact(contact.id),
  ])

  const isSeller = contact.type === 'seller' || contact.type === 'both'
  const isBuyer = contact.type === 'buyer' || contact.type === 'both'

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Link href="/contacts" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none' }}>
          ← Contacts
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel fade-up">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
              <div className={`contact-avatar ${avClass}`} style={{ width: 52, height: 52, fontSize: 16 }}>{contact.initials}</div>
              <div>
                <div className="contact-name" style={{ fontSize: 18 }}>{contact.name}</div>
                <div className="contact-role">{contact.relationship.split(',')[0]}</div>
              </div>
              {contact.type && (
                <div style={{ display: 'flex', gap: 5 }}>
                  {(contact.type === 'seller' || contact.type === 'both') && (
                    <span className="s-pill s-amber">seller</span>
                  )}
                  {(contact.type === 'buyer' || contact.type === 'both') && (
                    <span className="s-pill s-blue">buyer</span>
                  )}
                </div>
              )}
              <DecayPill tier={contact.decayTier} days={contact.daysSince} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="section-label">How we met</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>{contact.source}</div>
              </div>
              <div>
                <div className="section-label">Last contact</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{contact.lastInteractionDate}</div>
              </div>
            </div>
          </div>
          <div className="panel fade-up">
            <div className="section-label">Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {contact.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel fade-up">
            <div className="section-label">Context & background</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{contact.context}</div>
          </div>
          <div className="panel fade-up">
            <div className="section-label">Last interaction</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, marginBottom: 8 }}>{contact.lastInteractionSummary}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{contact.lastInteractionDate}</div>
          </div>
          {contact.notes && (
            <div className="panel fade-up" style={{ borderColor: 'rgba(180,83,9,0.2)' }}>
              <div className="section-label">Open items & notes</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{contact.notes}</div>
            </div>
          )}

          {isSeller && (
            <div className="panel fade-up">
              <div className="section-label" style={{ marginBottom: 10 }}>Their listings</div>
              {linkedListings.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>No listings on record</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedListings.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r-sm)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{l.address}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{l.price} · {l.daysOnMarket}d on market</div>
                      </div>
                      <span className={`s-pill ${listingStatusPill(l.status)}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {isBuyer && (
            <div className="panel fade-up">
              <div className="section-label" style={{ marginBottom: 10 }}>Their deals</div>
              {linkedDeals.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>No deals on record</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedDeals.map(d => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r-sm)' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{d.propertyAddress}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{d.value} · last activity {d.lastActivityDate}</div>
                      </div>
                      <span className={`s-pill ${dealStatusPill(d.status)}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
