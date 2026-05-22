# Plan: Real Estate Domain Redesign

> Source PRD: PRD.md

## Architectural decisions

- **Routes**: `/` (dashboard), `/contacts`, `/contacts/[id]`, `/listings` (new), `/deals` (new), `/alerts` (new)
- **Key models**: `Contact` (extended with `type: 'seller' | 'buyer' | 'both' | null`), `Listing` (hardcoded mock), `Deal` (hardcoded mock), `Alert` (hardcoded mock)
- **Data sources**: Contacts from CSV + `type` field overlay; Listings/Deals/Alerts from hardcoded arrays in `lib/mock-data.ts`
- **No DB changes**: Listings/Deals/Alerts stay in-memory mock for this sprint
- **Seller/buyer linkage**: Mock listings/deals reference contact names matching CSV `name` field exactly
- **UI pattern**: Next.js App Router, server components for data fetch, client components for interactivity, Tailwind CSS v4

---

## Phase 1: Nav strip + route scaffold

**User stories**: 24

### What to build

Remove Chat, Promises, Referral Sources, and Partners from navigation. Add Listings, Deals, and Alerts as nav items. Create stub pages for `/listings`, `/deals`, and `/alerts` that render a visible placeholder so the routes are demoable immediately.

### Acceptance criteria

- [ ] Nav sidebar contains exactly: Dashboard, Contacts, Listings, Deals, Alerts
- [ ] No Chat link anywhere in the app
- [ ] `/listings` renders without error (placeholder content OK)
- [ ] `/deals` renders without error (placeholder content OK)
- [ ] `/alerts` renders without error (placeholder content OK)
- [ ] Active nav item highlights correctly for all 5 routes

---

## Phase 2: Contact types + filters

**User stories**: 3, 4, 5, 6, 25

### What to build

Extend the contact data model with a `type` field. Assign `seller`, `buyer`, or `both` to all 50 contacts based on existing `relationship` text. Add Sellers and Buyers filter buttons to the contacts list alongside existing filters. Render a type badge on each contact row.

### Acceptance criteria

- [ ] All 50 contacts have a `type` value assigned
- [ ] Contacts list has Sellers and Buyers filter buttons
- [ ] Filtering by Sellers shows only contacts with type `seller` or `both`
- [ ] Filtering by Buyers shows only contacts with type `buyer` or `both`
- [ ] Existing filters (All, Clients, Referrals, Partners, Friends, Past) still work
- [ ] Each contact row displays a seller/buyer/both badge
- [ ] Search still works across all fields

---

## Phase 3: Contact detail cleanup

**User stories**: 7, 8, 9, 10, 11

### What to build

Remove the layout toggle (A/B/C/D) from contact detail. Fix Layout A (two-column sidebar + main) as the permanent layout. Add empty "Their Listings" and "Their Deals" sections at the bottom of the detail page — visible only when the contact's type matches (seller → listings section, buyer → deals section). Sections show empty state copy for now; they will be wired in Phase 4 and 5.

### Acceptance criteria

- [ ] Layout toggle UI is gone from contact detail
- [ ] Contact detail always renders two-column layout
- [ ] Seller contacts show "Their Listings" section (empty state)
- [ ] Buyer contacts show "Their Deals" section (empty state)
- [ ] Contacts typed `both` show both sections
- [ ] Contacts with no type show neither section

---

## Phase 4: Listings module

**User stories**: 12, 13, 14, 15

### What to build

Create a hardcoded array of 6–8 realistic listings, each with: address, price, seller name (matching a real CSV contact), status (`active | sold | withdrawn`), and days on market. Build the `/listings` page as a list of cards showing a photo placeholder, all listing fields, and seller name. Clicking any listing shows a "coming soon" state. Wire "Their Listings" section on contact detail to show matching listings for seller contacts.

### Acceptance criteria

- [ ] `/listings` page renders 6–8 listing cards
- [ ] Each card shows: photo placeholder, address, price, seller name, status badge, days on market
- [ ] Clicking a listing shows "coming soon" (toast or inline state)
- [ ] Seller contact detail "Their Listings" section shows their linked listing(s)
- [ ] Listings with status `sold` or `withdrawn` are visually distinct from `active`

---

## Phase 5: Deals module

**User stories**: 16, 17, 18, 19

### What to build

Create a hardcoded array of 4–5 deals, each with: buyer name (matching a real CSV contact), property address, status (`viewing | offer | negotiation | closed | lost`), deal value, and last activity date. Build the `/deals` page as a list of cards. Clicking any deal shows "coming soon". Wire "Their Deals" section on contact detail to show matching deals for buyer contacts.

### Acceptance criteria

- [ ] `/deals` page renders 4–5 deal cards
- [ ] Each card shows: buyer name, property address, status badge, deal value, last activity date
- [ ] Clicking a deal shows "coming soon" (toast or inline state)
- [ ] Buyer contact detail "Their Deals" section shows their linked deal(s)
- [ ] Status badges are visually distinct across the 5 statuses

---

## Phase 6: Dashboard redesign

**User stories**: 1, 2

### What to build

Replace the current dashboard with 4 metric cards (Total Contacts, Active Listings, Active Deals, Unread Alerts) backed by real counts from mock data. Add a top alerts feed showing the 3–5 most recent alerts. Remove the hardcoded Promises panel and the hardcoded Deals panel. Keep the header greeting.

### Acceptance criteria

- [ ] Dashboard shows exactly 4 metric cards with correct counts
- [ ] Total Contacts count matches the real contact list length
- [ ] Active Listings count matches listings with status `active`
- [ ] Active Deals count matches deals with status `viewing`, `offer`, or `negotiation`
- [ ] Unread Alerts count matches alerts data length
- [ ] Top alerts feed shows 3–5 alerts with contact name and reason
- [ ] Promises panel is gone
- [ ] Hardcoded deals panel is gone

---

## Phase 7: Alerts placeholder

**User stories**: 20, 21, 22, 23

### What to build

Build the `/alerts` page as a feed of hardcoded mock alerts, sorted newest-first. Each alert shows contact name, alert reason, and a primary action button label (e.g. "Call", "Follow up"). Add an empty state for when no alerts exist.

### Acceptance criteria

- [ ] `/alerts` renders a feed of mock alerts newest-first
- [ ] Each alert shows: contact name, reason text, action button
- [ ] Contact name in alert links to the correct contact detail page
- [ ] Empty state renders when alerts array is empty
- [ ] Action button is visible and styled (click behavior out of scope)
