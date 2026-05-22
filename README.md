# RafalCRM

Personal CRM for Rafał — built during AI Hackathon 2026 (MasterBorn, May 22).

## What it is

A relationship management tool tailored to a real estate agent's network. It surfaces who needs attention, tracks open promises, and provides rich context before a call or meeting.

## Getting started

```bash
pnpm install
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|---|---|
| `/` | Dashboard — metrics, today strip, recent alerts |
| `/contacts` | All contacts with filters and search |
| `/contacts/[id]` | Contact detail — listings/deals when linked |
| `/listings` | Property listings |
| `/deals` | Buyer deals |
| `/alerts` | AI-generated alerts |
| `/chat` | AI feature placeholder |

## Data layer

All runtime data comes from SQLite (`dev.db`) via Prisma: `contacts`, `listings`, `deals`, `alerts`. Read through [`lib/crm.ts`](lib/crm.ts). Seed with `pnpm db:seed` (contacts from `dataset-rafal.csv`, demo listings/deals/alerts from `prisma/seed-data/`).

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- TypeScript
- SQLite (Prisma) + better-sqlite3
