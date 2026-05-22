# PRD: Household & Couple Contact Modeling

## Problem Statement

A real estate agent's contacts often represent households or couples rather than single individuals. The current system stores one name, one phone, and one email per contact — making it impossible to track secondary members (spouse, partner, family member) with their own contact details and context. Agents lose critical relationship context and cannot reach all decision-makers in a household.

## Solution

Extend the Contact model to support arbitrary household members as a lightweight sub-record. A contact is labeled "individual" or "household" (derived from whether members exist). Each household member has their own name, contact details, and context note. The primary contact record remains the CRM unit of activity — household members are purely informational. An optional display name override allows agents to set how the household is addressed (e.g. "Jan & Anna Kowalski").

## User Stories

1. As an agent, I want to mark a contact as a household, so that I can track multiple people under one CRM record.
2. As an agent, I want to add household members with name, phone, email, and a context note, so that I have full contact details for every decision-maker.
3. As an agent, I want to add as many members as needed, so that I can model families, not just couples.
4. As an agent, I want to assign a role to each member (e.g. "spouse", "parent"), so that I understand the relationship at a glance.
5. As an agent, I want to set a custom display name for a household (e.g. "Kowalski Family"), so that communications feel personal and correct.
6. As an agent, I want the contact's own name to be the default display name when no override is set, so that I don't have to configure anything for simple cases.
7. As an agent, I want to see a member count badge on household contacts in the list, so that I can identify households at a glance.
8. As an agent, I want to filter the contacts list to show only households, so that I can focus outreach on couples and families.
9. As an agent, I want to search by a member's name and find their household contact, so that I don't lose a record just because someone isn't the primary contact.
10. As an agent, I want to add, edit, and remove household members inline on the contact detail page, so that managing the household is low-friction.
11. As an agent, I want all CRM activity (deals, listings, alerts, decay score) to remain on the primary contact record, so that household complexity doesn't fragment my workflow.

## Implementation Decisions

### Schema Changes
- Add `HouseholdMember` model with fields: `id`, `contactId` (FK), `name`, `phone` (optional), `email` (optional), `note` (optional), `role` (optional)
- Add `displayName: String?` to `Contact` — manual override for household address
- Remove `isHousehold: Boolean` from `Contact` — replaced by derived computed property `isHousehold = members.length > 0`
- Remove `deriveIsHousehold()` utility function

### Data Layer
- `getContact()` and `getContacts()` include `members` in query
- Search function matches on primary contact name OR any member name
- Household filter derived from `members` relation existence

### UI
- Contact list: household badge (member count), household filter chip
- Contact detail: inline "Household members" collapsible section with add/edit/remove per member
- All display name rendering: `displayName ?? name`

### Seed Data
- Update existing household seed contacts to include real `HouseholdMember` records demonstrating the new structure

## Testing Decisions

Good tests verify external behavior, not implementation: given a contact with members, the correct data is returned, search finds the right record, and derived `isHousehold` reflects reality.

Modules worth testing:
- Data layer: `getContacts()` with member search query
- Derived `isHousehold` logic
- Display name resolution (`displayName ?? name`)

## Out of Scope

- Household members participating in deals, listings, or alerts independently
- Auto-generating display name from member names
- Merging two individual contacts into a household
- Communication history per member

## Further Notes

This is a data modeling and UI feature only — no changes to the CRM activity model (deals, alerts, decay scoring). All CRM logic continues to operate on the primary Contact record.
