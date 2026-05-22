'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Contact } from '../lib/data'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active client', label: 'Clients' },
  { key: 'referral source', label: 'Referrals' },
  { key: 'key partner', label: 'Partners' },
  { key: 'close friend', label: 'Friends' },
  { key: 'past client', label: 'Past' },
]

const AV_COLORS = ['av-0','av-1','av-2','av-3','av-4','av-5']

function avatarClass(id: string) {
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

export default function ContactsList({ contacts }: { contacts: Contact[] }) {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = contacts
    .filter(c => {
      const matchFilter = activeFilter === 'all' || c.tags.some(t => t.toLowerCase() === activeFilter)
      const q = query.toLowerCase()
      const matchQuery = !q || c.name.toLowerCase().includes(q) || c.relationship.toLowerCase().includes(q) || c.notes.toLowerCase().includes(q)
      return matchFilter && matchQuery
    })
    .sort((a, b) => b.decayScore - a.decayScore)

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

      <div className="contact-list">
        {filtered.slice(0, 14).map(c => (
          <Link key={c.id} href={`/contacts/${c.id}`} className="crow">
            <div className={`av ${avatarClass(c.id)}`}>{c.initials}</div>
            <div className="cinfo">
              <div className="cname">{c.name}</div>
              <div className="crole">{c.relationship.split(',')[0]}</div>
            </div>
            <span className={`s-pill ${tierPill(c.decayTier)}`}>
              {c.decayTier === 'ok' ? 'ok' : c.decayTier}
            </span>
            <div className="decay-wrap">
              <div className="decay-track">
                <div
                  className="decay-fill"
                  style={{ width: `${Math.min(100, c.decayScore * 1.2)}%`, background: tierColor(c.decayTier) }}
                />
              </div>
              <div className="decay-days">{c.daysSince}d ago</div>
            </div>
          </Link>
        ))}
        {filtered.length > 14 && (
          <div style={{ padding: '8px 6px', fontSize: '11px', color: 'var(--text3)' }}>
            +{filtered.length - 14} more — <Link href="/contacts" style={{ color: 'var(--accent-dim)', textDecoration: 'none' }}>view all</Link>
          </div>
        )}
      </div>
    </>
  )
}
