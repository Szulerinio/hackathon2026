'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/contacts', label: 'Contacts', icon: '◎' },
  { href: '/chat', label: 'AI Chat', icon: '⌁' },
]

const SIDEBAR_ITEMS = [
  { section: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: '▤' },
    { href: '/contacts', label: 'All contacts', icon: '⊙', badge: null },
    { href: '/alerts', label: 'Alerts', icon: '◈', badge: '7', badgeType: 'red' },
  ]},
  { section: 'Business', items: [
    { href: '/deals', label: 'Active deals', icon: '◫', badge: null },
    { href: '/promises', label: 'Promises', icon: '◻', badge: '9', badgeType: 'amber' },
  ]},
  { section: 'Network', items: [
    { href: '/referrals', label: 'Referral sources', icon: '◈', badge: null },
    { href: '/partners', label: 'Partners', icon: '◫', badge: null },
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
        <div className="sidebar-bottom">
          <Link href="/chat" className="ai-chat-btn">
            ✦ Ask AI anything
          </Link>
        </div>
      </aside>
    </>
  )
}
