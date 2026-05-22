'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS: { href: string; label: string; icon: string }[] = []

const SIDEBAR_ITEMS = [
  { section: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: '▤', badge: null, badgeType: null },
    { href: '/contacts', label: 'All contacts', icon: '⊙', badge: null, badgeType: null },
    { href: '/alerts', label: 'Alerts', icon: '◈', badge: '5', badgeType: 'red' },
  ]},
  { section: 'Business', items: [
    { href: '/listings', label: 'Listings', icon: '⊟', badge: null, badgeType: null },
    { href: '/deals', label: 'Deals', icon: '◫', badge: null, badgeType: null },
  ]},
]

export default function Nav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-dot" />
          RafalCRM
        </div>
        <nav className="topbar-nav">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`tnav${isActive(item.href) ? ' active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="topbar-right">
          <span className="date-chip">Fri, May 22 2026</span>
          <div className="avatar-top">RW</div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="sidebar">
        {SIDEBAR_ITEMS.map(group => (
          <div key={group.section}>
            <div className="sec-label">{group.section}</div>
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`snav${isActive(item.href) ? ' active' : ''}`}
              >
                <span className="snav-icon">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className={item.badgeType === 'amber' ? 'snav-badge-a' : 'snav-badge'}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </aside>
    </>
  )
}
