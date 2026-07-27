const missingTokens = new Set(['', '-', 'n/d', 'nd', 'n.a.', 'n/a', 'null', 'undefined'])

export function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).replace(/\u00a0/g, ' ').trim()
  return missingTokens.has(text.toLocaleLowerCase('pt-PT')) ? null : text
}

export function normalizeKey(value: unknown): string {
  return (normalizeText(value) ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normalizeHeader(value: unknown, index: number): string {
  const base = normalizeKey(value).replace(/\s+/g, '_')
  return base || `column_${index + 1}`
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = normalizeText(value)
  if (!text) return null
  const normalized = text.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

export function parseInteger(value: unknown): number | null {
  const number = parseNumber(value)
  return number === null ? null : Math.trunc(number)
}

export function parsePercentage(value: unknown): number | null {
  const number = parseNumber(value)
  if (number === null) return null
  return number > 1 ? number / 100 : number
}

export interface MoneyValue {
  guaranteed: number | null
  possible: number | null
  currency: 'EUR' | null
  raw: string | null
}

function moneyPartToNumber(part: string): number | null {
  const clean = part.replace(/\u00a0/g, ' ').trim()
  const match = clean.match(/(-?\d+(?:[.,]\d+)?)\s*(k|m|mil|milh(?:ao|oes)?)?/i)
  if (!match) return null
  const numeric = match[1]
  const normalizedNumeric = /[.,]\d{3}$/.test(numeric)
    ? numeric.replace(/[.,]/g, '')
    : numeric.replace(',', '.')
  const base = Number(normalizedNumeric)
  if (!Number.isFinite(base)) return null
  const unit = (match[2] ?? '').toLocaleLowerCase('pt-PT')
  if (unit === 'k' || unit === 'mil') return base * 1_000
  if (unit === 'm' || unit.startsWith('milh')) return base * 1_000_000
  return base
}

export function parseMoney(value: unknown): MoneyValue {
  const raw = normalizeText(value)
  if (!raw) return { guaranteed: null, possible: null, currency: null, raw: null }
  const main = raw.split('(')[0]
  const possibleMatch = raw.match(/\(([^)]+)\)/)
  return {
    guaranteed: moneyPartToNumber(main),
    possible: possibleMatch ? moneyPartToNumber(possibleMatch[1]) : null,
    currency: /€|eur/i.test(raw) ? 'EUR' : null,
    raw,
  }
}

export function parseAppearances(value: unknown): { starts: number; substitute: number; total: number } {
  const text = normalizeText(value)
  if (!text) return { starts: 0, substitute: 0, total: 0 }
  const match = text.match(/(\d+)(?:\s*\((\d+)\))?/)
  if (!match) return { starts: 0, substitute: 0, total: 0 }
  const starts = Number(match[1])
  const substitute = Number(match[2] ?? 0)
  return { starts, substitute, total: starts + substitute }
}

export function excelSerialToIso(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30)
    return new Date(excelEpoch + value * 86_400_000).toISOString().slice(0, 10)
  }
  const text = normalizeText(value)
  if (!text) return null
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10)
}
