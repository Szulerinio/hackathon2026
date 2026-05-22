'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Contact } from '../lib/crm'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active client', label: 'Clients' },
  { key: 'referral source', label: 'Referrals' },
  { key: 'key partner', label: 'Partners' },
  { key: 'close friend', label: 'Friends' },
  { key: 'past client', label: 'Past' },
  { key: 'seller', label: 'Sellers' },
  { key: 'buyer', label: 'Buyers' },
  { key: 'household', label: 'Households' },
]

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5']

function avatarClass(id: string | undefined) {
  if (!id) return AV_COLORS[0]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return AV_COLORS[h % AV_COLORS.length]
}

function tierColor(tier: Contact['decayTier']) {
  if (tier === 'urgent') return 'var(--red)'
  if (tier === 'warning') return 'var(--amber)'
  if (tier === 'watch') return 'var(--blue)'
  return 'var(--green)'
}

function tierPill(tier: Contact['decayTier']) {
  if (tier === 'urgent') return 's-red'
  if (tier === 'warning') return 's-amber'
  if (tier === 'watch') return 's-blue'
  return 's-green'
}

function typeBadgeStyle(type: Contact['type']): React.CSSProperties {
  if (type === 'seller') return { background: 'var(--amber-bg)', color: 'var(--amber)' }
  if (type === 'buyer') return { background: 'var(--blue-bg)', color: 'var(--blue)' }
  return { background: 'var(--green-bg)', color: 'var(--green)' }
}

function matchesFilter(c: Contact, activeFilter: string): boolean {
  if (activeFilter === 'all') return true
  if (activeFilter === 'seller') return c.type === 'seller' || c.type === 'both'
  if (activeFilter === 'buyer') return c.type === 'buyer' || c.type === 'both'
  if (activeFilter === 'household') return c.isHousehold
  return c.tags.some(t => t.toLowerCase() === activeFilter)
}

export default function ContactsList({
  contacts,
  showAll = false,
}: {
  contacts: Contact[]
  showAll?: boolean
}) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = contacts
    .filter(c => {
      const q = query.toLowerCase()
      const matchesMembers = c.members.some(m => m.name.toLowerCase().includes(q))
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.relationship.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q) || matchesMembers
      return matchesFilter(c, activeFilter) && matchQuery
    })
    .sort((a, b) => b.decayScore - a.decayScore)

  const displayed = showAll ? filtered : filtered.slice(0, 14)

  return (
    <>
      <div className="search-bar">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name, topic, notes…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`chip${activeFilter === f.key ? ' on' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="panel contacts-table-panel" style={{ padding: 0 }}>
        <div
          className="contacts-table-head"
          style={{
          display: 'grid',
          gridTemplateColumns: '2fr 80px 1fr 76px 1fr 80px 100px',
          gap: 8,
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--text3)',
        }}
        >
          <div>Name</div>
          <div>Type</div>
          <div>Relationship</div>
          <div>Status</div>
          <div />
          <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>HH Member</div>
          <div>Last contact</div>
        </div>

        <div className="contacts-table-body">
        {displayed.map((c, i) => (
          <Link
            key={c.id}
            href={`/contacts/${c.id}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 80px 1fr 76px 1fr 80px 100px',
              gap: 8,
              padding: '11px 16px',
              borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              transition: 'background 0.1s',
            }}
            className="crow-panel"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div className={`av ${avatarClass(c.id)}`}>{c.initials}</div>
              <div className="cname">{c.displayName}</div>
            </div>
            <div>
              {c.type && (
                <span style={{
                  ...typeBadgeStyle(c.type),
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: 6,
                }}>
                  {c.type}
                </span>
              )}
            </div>
            <div className="crole">{c.relationship.split(',')[0]}</div>
            <span className={`s-pill ${tierPill(c.decayTier)}`}>
              {c.decayTier === 'ok' ? 'ok' : c.decayTier}
            </span>
            <div />
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--green)' }}>
              {c.members.length > 0 ? '✓' : ''}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.daysSince}d ago</div>
          </Link>
        ))}
        </div>

        <div className="contacts-table-foot">
          {showAll ? (
            <>Showing {displayed.length} of {contacts.length} contacts</>
          ) : filtered.length > 14 ? (
            <>
              Showing 14 of {filtered.length} —{' '}
              <Link href="/contacts" style={{ color: 'var(--accent-dim)', textDecoration: 'none' }}>
                view all
              </Link>
            </>
          ) : (
            <>Showing {displayed.length} contact{displayed.length === 1 ? '' : 's'}</>
          )}
        </div>
      </div>
    </>
  )
}
