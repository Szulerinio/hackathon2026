# RafalCRM

Personal CRM for Rafał — built during AI Hackathon 2026 (MasterBorn, May 22).

## What it is

A relationship management tool tailored to a real estate agent's network. It surfaces who needs attention, tracks open promises, and provides rich context before a call or meeting.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> The app reads from `../dataset-rafal.csv` (one level above `my-app/`). Keep that file in place while on CSV.

## Routes

| Route | Description |
|---|---|
| `/` | Dashboard — metrics, contact list, AI alerts, deals, promises |
| `/contacts/[id]` | Contact detail — 4 layout variants (toggle via `?layout=a/b/c/d`) |
| `/chat` | AI feature placeholder |

## Data layer

Currently reads from `dataset-rafal.csv`. The data access layer is isolated in `lib/data.ts` — swap the internals there when SQLite is ready. The API routes (`/api/contacts`, `/api/contacts/[id]`) are the contract the rest of the app uses.

## Stack

- Next.js 16 (App Router)
- Tailwind CSS v4
- TypeScript
- Data: CSV → SQLite (planned)
