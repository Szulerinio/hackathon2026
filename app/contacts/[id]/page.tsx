import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContact } from '../../../lib/data'
import { Suspense } from 'react'
import LayoutToggle from './layout-toggle'
import TabbedLayout from './tabs'

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5']
function avatarClass(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AV_COLORS[h % AV_COLORS.length]
}

function DecayPill({ tier, days }: { tier: string; days: number }) {
  const cls = tier === 'urgent' ? 's-red' : tier === 'warning' ? 's-amber' : tier === 'watch' ? 's-blue' : 's-green'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
      <span className={`s-pill ${cls}`}>{tier}</span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{days}d since contact</span>
    </div>
  )
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ layout?: string }>
}) {
  const { id } = await params
  const { layout = 'a' } = await searchParams
  const contact = getContact(id)
  if (!contact) notFound()

  const avClass = avatarClass(contact.id)
  const decayCls = contact.decayTier === 'urgent' ? 's-red' : contact.decayTier === 'warning' ? 's-amber' : contact.decayTier === 'watch' ? 's-blue' : 's-green'

  return (
    <>
      {/* Back + layout toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Link href="/" style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Dashboard
        </Link>
        <Suspense fallback={null}>
          <LayoutToggle contactId={id} />
        </Suspense>
      </div>

      {/* ── LAYOUT A: Two-column ── */}
      {layout === 'a' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14 }}>
          {/* Left col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="panel fade-up">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10, paddingBottom: 14, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <div className={`contact-avatar ${avClass}`} style={{ width: 52, height: 52, fontSize: 16 }}>{contact.initials}</div>
                <div>
                  <div className="contact-name" style={{ fontSize: 18 }}>{contact.name}</div>
                  <div className="contact-role">{contact.relationship.split(',')[0]}</div>
                </div>
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

          {/* Right col */}
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
          </div>
        </div>
      )}

      {/* ── LAYOUT B: Single-column stack ── */}
      {layout === 'b' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
          <div className="panel fade-up">
            <div className="contact-header">
              <div className={`contact-avatar ${avClass}`}>{contact.initials}</div>
              <div style={{ flex: 1 }}>
                <div className="contact-name">{contact.name}</div>
                <div className="contact-role">{contact.relationship.split(',')[0]}</div>
              </div>
              <DecayPill tier={contact.decayTier} days={contact.daysSince} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {contact.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
          </div>

          <div className="panel fade-up">
            <div className="section-label">Context & background</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{contact.context}</div>
          </div>

          <div className="panel fade-up">
            <div className="section-label">Last interaction · {contact.lastInteractionDate}</div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{contact.lastInteractionSummary}</div>
          </div>

          <div className="panel fade-up">
            <div className="section-label">How we met</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{contact.source}</div>
          </div>

          {contact.notes && (
            <div className="panel fade-up" style={{ borderColor: 'rgba(180,83,9,0.2)' }}>
              <div className="section-label">Open items & notes</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{contact.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* ── LAYOUT C: Tabs ── */}
      {layout === 'c' && (
        <div style={{ maxWidth: 700 }}>
          <Suspense fallback={null}>
            <TabbedLayout contact={contact} />
          </Suspense>
        </div>
      )}

      {/* ── LAYOUT D: Pre-call briefing ── */}
      {layout === 'd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Briefing hero card */}
          <div className="panel fade-up" style={{ borderLeft: '3px solid var(--accent-dim)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div className={`contact-avatar ${avClass}`}>{contact.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-dim)', marginBottom: 3 }}>
                  Before you call
                </div>
                <div className="contact-name" style={{ fontSize: 20 }}>{contact.name}</div>
              </div>
              <DecayPill tier={contact.decayTier} days={contact.daysSince} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <div className="section-label">Last talked about</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, marginTop: 4 }}>
                  {contact.lastInteractionSummary.slice(0, 120)}{contact.lastInteractionSummary.length > 120 ? '…' : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>{contact.lastInteractionDate}</div>
              </div>
              <div style={{ background: contact.notes ? 'rgba(180,83,9,0.05)' : 'var(--surface2)', border: contact.notes ? '1px solid rgba(180,83,9,0.15)' : '1px solid transparent', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <div className="section-label">Open items</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, marginTop: 4 }}>
                  {contact.notes ? contact.notes.slice(0, 120) + (contact.notes.length > 120 ? '…' : '') : 'Nothing outstanding.'}
                </div>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <div className="section-label">Relationship</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, marginTop: 4 }}>
                  {contact.relationship.split(',')[0]}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {contact.tags.slice(0, 3).map(t => <span key={t} className="tag" style={{ fontSize: 9 }}>{t}</span>)}
                </div>
              </div>
            </div>
          </div>

          {/* Lower two panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="panel fade-up">
              <div className="section-label">Background</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.7 }}>{contact.context}</div>
            </div>
            <div className="panel fade-up">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div className="section-label">How we met</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{contact.source}</div>
                </div>
                <div>
                  <div className="section-label">All tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {contact.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
                <div>
                  <div className="section-label">Relationship quality</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: 'var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(5, 100 - contact.decayScore)}%`,
                        background: contact.decayTier === 'urgent' ? 'var(--red)' : contact.decayTier === 'warning' ? 'var(--amber)' : 'var(--green)',
                        borderRadius: 3,
                      }} />
                    </div>
                    <span className={`s-pill ${decayCls}`}>{contact.decayTier}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
