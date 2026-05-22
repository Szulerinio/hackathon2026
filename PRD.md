# PRD: RafalCRM — Real Estate Domain Redesign

## Problem Statement

Rafał is a real estate agent managing a complex network of sellers, buyers, contractors, brokers, and past clients. The current CRM treats all contacts as a flat, undifferentiated list with no connection to properties or deals. There is no way to see which contacts are actively selling, which are buying, or how a specific person relates to an active transaction. Navigation includes placeholder modules (Promises, Referral Sources, Partners, Chat) that create noise without value. The dashboard surfaces hardcoded data that doesn't reflect real workflow. Rafał cannot answer "who is selling what?" or "which buyer is in which deal?" without leaving the app.

## Solution

Restructure the UI around Rafał's actual workflow: contacts typed as sellers and/or buyers, a Listings module linking properties to seller contacts, a Deals module linking buyer contacts to properties, and an Alerts feed driven by AI analysis of contact notes. Strip all nav items that don't serve this workflow. Keep data grounded in the existing 50-contact dataset, supplemented by hardcoded mock listings and deals that reference real contacts by name.

## User Stories

1. As Rafał, I want to see a dashboard with 4 metric cards (Contacts, Listings, Deals, Alerts) so that I have an at-a-glance overview of my business.
2. As Rafał, I want the dashboard to show a feed of top urgent alerts so that I know immediately who needs attention today.
3. As Rafał, I want a Contacts page that lists all 50 contacts so that I can find anyone in my network quickly.
4. As Rafał, I want to filter contacts by All, Clients, Referrals, Partners, Friends, Past, Sellers, and Buyers so that I can focus on the right segment.
5. As Rafał, I want each contact to display a seller/buyer/both badge so that I can see their role at a glance.
6. As Rafał, I want to search contacts by name, topic, and notes so that I can find people based on context I remember.
7. As Rafał, I want to open a contact detail page in a clean two-column layout (sidebar + main) so that I can read full context without visual clutter.
8. As Rafał, I want the contact detail sidebar to show name, role badges, decay status, how we met, last contact date, and tags so that I have the key facts visible at all times.
9. As Rafał, I want the contact detail main area to show context, last interaction summary, and open notes so that I can recall the full relationship history.
10. As Rafał, I want a "Their Listings" section on a seller contact's detail page so that I can see which properties they are selling.
11. As Rafał, I want a "Their Deals" section on a buyer contact's detail page so that I can see which transactions they are involved in.
12. As Rafał, I want a Listings page that shows all active and past property listings so that I can manage my seller inventory.
13. As Rafał, I want each listing card to show a photo placeholder, address, price, seller name (linked to contact), status, and days on market so that I can assess each property quickly.
14. As Rafał, I want listing statuses of Active, Sold, and Withdrawn so that I can filter the pipeline by stage.
15. As Rafał, I want clicking a listing to show a "coming soon" state so that the UI feels complete without requiring a full detail page for the demo.
16. As Rafał, I want a Deals page that shows all active and past deals so that I can track buyer transactions.
17. As Rafał, I want each deal card to show buyer name, property address, deal status, deal value, and last activity date so that I can see deal health at a glance.
18. As Rafał, I want deal statuses of Viewing, Offer, Negotiation, Closed, and Lost so that I can track where each buyer is in the purchase process.
19. As Rafał, I want clicking a deal to show a "coming soon" state so that the UI feels complete without requiring a full detail page for the demo.
20. As Rafał, I want an Alerts page that shows AI-generated alerts from my contact notes so that I am proactively reminded of things I might miss.
21. As Rafał, I want each alert to show the contact name, the alert reason, and a primary action button (e.g. "Call", "Follow up") so that I can act directly from the alert.
22. As Rafał, I want the Alerts page to show alerts newest-first so that the most recent AI insights surface at the top.
23. As Rafał, I want the Alerts page to be a visual placeholder when no alerts are generated so that the UI doesn't feel broken.
24. As Rafał, I want a navigation sidebar with exactly: Dashboard, Contacts, Listings, Deals, Alerts — nothing else — so that the app feels focused on my real workflow.
25. As Rafał, I want contacts tagged as seller/buyer based on their relationship type so that the typed view reflects my real network without manual re-entry.

## Implementation Decisions

### Navigation
- Remove: Promises, Referral Sources, Partners, AI Chat from navigation
- New sidebar items: Dashboard, Contacts, Listings, Deals, Alerts
- Topbar: retain greeting and date; remove Chat shortcut

### Contact Data Model Extension
- Add `type` field to contact: `'seller' | 'buyer' | 'both' | null`
- Type assigned manually for all 50 contacts based on existing `relationship` text (e.g. "current client" → buyer, "selling" → seller)
- Existing decay score, tags, and interaction fields unchanged

### Contact List
- Add two new filter buttons: Sellers, Buyers (appended after existing filters)
- Contact row displays seller/buyer badge alongside existing role pill
- No changes to search behavior

### Contact Detail
- Remove layout toggle (A/B/C/D) — fix Layout A (two-column) as only layout
- Add "Their Listings" section: compact linked listing cards, visible only if contact type includes seller
- Add "Their Deals" section: compact linked deal cards, visible only if contact type includes buyer
- Linked cards in detail page are display-only (no navigation to detail for now)

### Listings Module
- New route: `/listings`
- Data: hardcoded array of 6–8 listings, each referencing a real contact name from CSV as seller
- Listing fields: `id`, `address`, `price`, `sellerName`, `status` (`active | sold | withdrawn`), `daysOnMarket`, `photoPlaceholder`
- List view only; clicking row shows "coming soon" toast or state

### Deals Module
- New route: `/deals`
- Data: hardcoded array of 4–5 deals, each referencing a real contact name from CSV as buyer
- Deal fields: `id`, `buyerName`, `propertyAddress`, `status` (`viewing | offer | negotiation | closed | lost`), `value`, `lastActivityDate`
- List view only; clicking row shows "coming soon" toast or state

### Dashboard
- Replace existing hardcoded panels with:
  - 4 metric cards: Total Contacts, Active Listings, Active Deals, Unread Alerts
  - Top alerts feed (3–5 items, pulled from alerts data)
- Remove: Promises panel, hardcoded deals panel, hardcoded contact panel
- Keep: header greeting, today strip (if data supports it)

### Alerts Module
- New route: `/alerts`
- Data: hardcoded placeholder alerts for demo (3–5 items) tied to real contact names
- Alert fields: `id`, `contactName`, `reason`, `actionLabel`, `createdAt`
- Feed sorted newest-first
- Empty state shown when no alerts exist
- Future: AI generates alerts by analyzing contact notes on every save; stored to cache

### Multi-Contact Deals
- Not implemented in this scope
- Architecture should not prevent adding a `buyers: Contact[]` relation later

## Testing Decisions

This is a hackathon UI mockup. No automated test suite is required for this scope.

If tests are added later, good tests for this codebase should:
- Test behavior visible to the user (filter results, badge display, routing), not component internals
- Use real hardcoded mock data, not mocks of mocks
- Cover: contact filter logic, type badge rendering, listings/deals list rendering with expected fields

## Out of Scope

- Listings detail page
- Deals detail page
- AI alert generation (UI placeholder only)
- Multi-contact deals (two buyers on same transaction)
- Editing contacts, listings, or deals in the UI
- Database integration for listings or deals (friend's team handles DB)
- Promises module
- Referral Sources module
- Partners module
- AI Chat

## Further Notes

- All listings and deals data is hardcoded mock data. Seller/buyer names in mock data must exactly match contact names in the CSV so linked cards can resolve correctly.
- The app is built for a live hackathon demo. One polished flow matters more than broad feature coverage.
- Contact type (`seller/buyer/both`) should be derivable programmatically from the `relationship` field for the 50 existing contacts — manual assignment during this sprint is acceptable.
- Multi-contact deals is flagged as a potentially defining product feature by the team. Architecture should keep a door open for `deal.buyers: Contact[]` without building it now.
