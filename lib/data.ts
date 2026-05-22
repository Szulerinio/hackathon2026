import fs from 'fs'
import path from 'path'
import { CONTACT_TYPES } from './mock-data'

export interface Contact {
  id: string
  name: string
  relationship: string
  source: string
  context: string
  lastInteractionDate: string
  lastInteractionSummary: string
  tags: string[]
  notes: string
  initials: string
  daysSince: number
  decayScore: number
  decayTier: 'urgent' | 'warning' | 'watch' | 'ok'
  type: 'seller' | 'buyer' | 'both' | null
}

const THRESHOLDS: Record<string, number> = {
  'active client': 7,
  'hot lead': 10,
  'key partner': 14,
  'close partner': 14,
  'close friend': 30,
  'warm lead': 30,
  'referral source': 21,
  'family': 30,
  'investor': 14,
  'contractor': 21,
  'past client': 90,
  'professional': 60,
  'first-time buyer': 7,
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ę/g, 'e').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ł/g, 'l').replace(/ź/g, 'z')
    .replace(/ż/g, 'z').replace(/ć/g, 'c').replace(/ń/g, 'n')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const TODAY = new Date('2026-05-22')

function computeDaysSince(dateStr: string): number {
  const date = new Date(dateStr)
  return Math.max(0, Math.floor((TODAY.getTime() - date.getTime()) / 86400000))
}

function computeDecay(tags: string[], lastDate: string) {
  const days = computeDaysSince(lastDate)
  let threshold = 180
  for (const tag of tags) {
    const t = tag.trim().toLowerCase()
    if (THRESHOLDS[t] !== undefined) {
      threshold = Math.min(threshold, THRESHOLDS[t])
    }
  }
  const score = Math.min(100, Math.round((days / threshold) * 50))
  const tier: Contact['decayTier'] =
    score >= 80 ? 'urgent' : score >= 50 ? 'warning' : score >= 25 ? 'watch' : 'ok'
  return { score, days, tier }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n')
  const headers = parseCSVLine(lines[0])
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

let _cache: Contact[] | null = null

export function getContacts(): Contact[] {
  if (_cache) return _cache
  const csvPath = path.join(process.cwd(), 'dataset-rafal.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  _cache = rows.map(row => {
    const tags = row.tags.split(',').map(t => t.trim()).filter(Boolean)
    const decay = computeDecay(tags, row.last_interaction_date)
    return {
      id: slugify(row.name),
      name: row.name,
      relationship: row.relationship,
      source: row.source,
      context: row.context,
      lastInteractionDate: row.last_interaction_date,
      lastInteractionSummary: row.last_interaction_summary,
      tags,
      notes: row.notes,
      initials: getInitials(row.name),
      daysSince: decay.days,
      decayScore: decay.score,
      decayTier: decay.tier,
      type: CONTACT_TYPES[row.name] ?? null,
    }
  })
  return _cache
}

export function getContact(id: string): Contact | undefined {
  return getContacts().find(c => c.id === id)
}
