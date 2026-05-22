# Plan: Household Contact Modeling

> Source PRD: plans/prd-household-contacts.md

## Architectural decisions

- **Schema**: New `HouseholdMember` model with FK to `Contact`. `displayName` field added to `Contact`. `isHousehold` boolean removed — derived from `members.length > 0`.
- **CRM unit**: All activity (deals, listings, alerts, decay) stays on `Contact`. `HouseholdMember` is purely informational.
- **Member CRUD**: Server actions (Next.js) — no new REST routes needed.
- **Search**: Client-side filter in contacts list extended to match member names.
- **Display name resolution**: `contact.displayName ?? contact.name` everywhere.

---

## Phase 1: Schema + Seed Data

**User stories**: #1, #2, #3, #4, #6

### What to build

Add `HouseholdMember` model to schema and run migration. Add `displayName` field to `Contact`. Remove `isHousehold` boolean. Update seed data so existing household contacts have real `HouseholdMember` records demonstrating the structure.

### Acceptance criteria

- [ ] `HouseholdMember` table exists with fields: `id`, `contactId`, `name`, `phone`, `email`, `note`, `role`
- [ ] `Contact` has `displayName: String?` field
- [ ] `Contact` no longer has `isHousehold` boolean
- [ ] Seed data includes household contacts with at least one member each
- [ ] `prisma db seed` runs without error

---

## Phase 2: Data Layer + Search

**User stories**: #9, #11

### What to build

Update `getContacts()` and `getContact()` queries to include `members` relation. Add computed `isHousehold` property to the `Contact` type (`members.length > 0`). Extend client-side search to match against member names. Update `mapContact()` to handle new fields. Remove `deriveIsHousehold()` utility.

### Acceptance criteria

- [ ] `GET /api/contacts` returns contacts with `members` array
- [ ] `GET /api/contacts/[id]` returns contact with `members` array
- [ ] `contact.isHousehold` is `true` when contact has members
- [ ] `contact.displayName` resolves to override or falls back to `name`
- [ ] Searching "Anna" surfaces Kowalski household if Anna is a member
- [ ] `deriveIsHousehold` function removed

---

## Phase 3: Contacts List UI

**User stories**: #7, #8

### What to build

Add household member count badge to household contacts in the list. Add "Household" filter chip to the existing filter bar. Filter shows only contacts with `isHousehold === true`.

### Acceptance criteria

- [ ] Household contacts show member count badge in list (e.g. "2 members")
- [ ] "Household" filter chip appears in filter bar
- [ ] Selecting "Household" filter shows only household contacts
- [ ] Non-household contacts show no badge
- [ ] Searching by member name returns the household contact

---

## Phase 4: Contact Detail — Inline Member Management

**User stories**: #5, #6, #10

### What to build

Add "Household members" section to contact detail page. Section shows all members with their fields. Agent can add a new member via inline form, edit an existing member, and remove a member. Server actions handle create/update/delete. Display name override field added to contact detail.

### Acceptance criteria

- [ ] "Household members" section visible on contact detail for all contacts
- [ ] Section shows existing members with name, phone, email, note, role
- [ ] "Add member" inline form works — member appears after submit
- [ ] Edit member in-place works
- [ ] Remove member works with confirmation
- [ ] `displayName` override field on detail page — saving updates displayed name in list + detail
- [ ] Adding first member causes contact to show as household in list
- [ ] Removing last member reverts contact to individual in list
