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


const PLACEHOLDER_ENTITY_TOKENS = new Set([
  'nome', 'idu', 'equipa', 'club', 'club name', 'clube', 'nome do clube',
  'competition', 'competicao', 'pessoa', 'jogador', 'treinador', 'pais',
  'country', 'continente', 'continent',
])

/** Identifies embedded/repeated headers and generic placeholders inside FM exports. */
export function isPlaceholderEntityValue(value: unknown): boolean {
  const key = normalizeKey(value)
  return !key || PLACEHOLDER_ENTITY_TOKENS.has(key)
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
  const compact = clean.replace(/[€$£]/g, '').replace(/\b(?:eur|usd|gbp)\b/gi, '').replace(/\/?p\/?a/gi, '').replace(/\s/g, '')
  const unitMatch = compact.match(/(k|K|m|M|mil|MIL|milh(?:ao|oes)?|MILH(?:AO|OES)?)$/)
  const unitRaw = unitMatch?.[1] ?? ''
  const unit = unitRaw.toLocaleLowerCase('pt-PT')
  const numericPart = unitMatch ? compact.slice(0, -unitRaw.length) : compact
  const numericMatch = numericPart.match(/-?[0-9][0-9.,]*/)
  if (!numericMatch) return null
  const token = numericMatch[0]
  let normalized: string
  if (/^[-+]?\d{1,3}(?:[.,]\d{3}){1,}$/.test(token)) normalized = token.replace(/[.,]/g, '')
  else if (token.includes(',') && token.includes('.')) {
    const lastComma = token.lastIndexOf(',')
    const lastDot = token.lastIndexOf('.')
    const decimal = lastComma > lastDot ? ',' : '.'
    normalized = token.replace(decimal === ',' ? /\./g : /,/g, '').replace(decimal, '.')
  } else if (/[.,]\d{3}$/.test(token) && !unit) normalized = token.replace(/[.,]/g, '')
  else normalized = token.replace(',', '.')
  const base = Number(normalized)
  if (!Number.isFinite(base)) return null
  // Nas exportações PT do FM, `m` minúsculo significa mil; `M` maiúsculo significa milhão.
  if (unitRaw === 'm' || unit === 'k' || unit === 'mil') return base * 1_000
  if (unitRaw === 'M' || unit.startsWith('milh')) return base * 1_000_000
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

/** Cleans recurrent FM export artefacts without changing meaningful internal punctuation. */
const BUILT_IN_CLUB_NAME_ALIASES: Record<string, string> = {
  'eintracht frankurt': 'Eintracht Frankfurt',
  'fc blau weib linz': 'FC Blau-Weiß Linz',
  'fc nordsjalland': 'FC Nordsjælland',
  'al lttihad ksa': 'Al-Ittihad (KSA)',
  'shabab ai ahli': 'Shabab Al-Ahli',
  'i fc magdeburg': '1. FC Magdeburg',
  'genclerbirliei': 'Gençlerbirliği',
  'i fc nurnberg': '1. FC Nürnberg',
  'ai jazira uae': 'Al-Jazira (UAE)',
  'fc kabenhavn': 'FC København',
  'rcd mailorca': 'RCD Mallorca',
  'gazi ehir fk': 'Gazişehir FK',
  'strgmsgodset': 'Strømsgodset',
  'cs marftimo': 'CS Marítimo',
  'ai ahli ksa': 'Al-Ahli (KSA)',
  'boda glimt': 'Bodø/Glimt',
  'brandby if': 'Brøndby IF',
  'fbc meigar': 'FBC Melgar',
  'lillestram': 'Lillestrøm',
  'ai taawoun': 'Al-Taawoun',
  'fc kaiserslautern': '1. FC Kaiserslautern',
  'wsg tiro': 'WSG Tirol',
  'st galien': 'St. Gallen',
  'dnipro l': 'Dnipro-1',
  'ai ahly': 'Al-Ahly',
  'ijniv catolica': 'Univ. Católica',
  'bg pathum ijtd': 'BG Pathum Utd',
  'bamk ostrava': 'Baník Ostrava',
  'al wahda ijae': 'Al-Wahda (UAE)',
  'yokohama m': 'Yokohama F･M',
  'ai ain': 'Al-Ain',
  'tromsg': 'Tromsø',
  'ij s lecce': 'U.S. Lecce',
  'sheff ijtd': 'Sheff Utd',
  'pogoo': 'Pogoń',
  'la equi a': 'La Equidad',
  'kasmpa a': 'Kasımpaşa',
  'ijjpest': 'Újpest',
  'ijral': 'Ural',
  'kghm zaqlebi': 'KGHM Zagłębie',
  'nottinham forest': 'Nottingham Forest',
  'yokohama f marinos': 'Yokohama F. Marinos',
  'eggina': 'Reggiana',
  'melbourne city fc': 'Melbourne City',
  'cape town city fc': 'Cape Town City',
  'liverpool f c': 'Liverpool',
  'port city fc': 'Port City FC',
}

const BUILT_IN_COMPETITION_NAME_ALIASES: Record<string, string> = {
  'totalenergies caf cha mpions league': 'TotalEnergies CAF Champions League',
  'superspoft hrvatska nogometna liga': 'SuperSport Hrvatska nogometna liga',
  'pko bank poiski ekstraklasa': 'PKO Bank Polski Ekstraklasa',
  'meiji yasuda ji league': 'Meiji Yasuda J1 League',
  'misli premyer liqasl': 'Misli Premyer Liqası',
  'piva liga telemach': 'Prva liga Telemach',
  'tota ienergies caf confederation cup': 'TotalEnergies CAF Confederation Cup',
  'liga profesional de futi l': 'Liga Profesional de Fútbol',
  'abc asian cup': 'AFC Asian Cup',
  'taca das nacoes arat s': 'Taça das Nações Árabes',
  'taca das nacoes aratps': 'Taça das Nações Árabes',
  'mozzart bet sul rliga': 'Mozzart Bet SuperLiga',
  'k league i': 'K League 1',
  '1a divisao dos eau': '1ª Divisão dos E.A.U.',
  'trendyol lig': 'Trendyol Süper Lig',
  'torneo sur finanzas avxrtura': 'Torneo Sur Finanzas Apertura',
  'liga bbva mx alxrtura': 'Liga BBVA MX - Apertura',
  'tota ienergies african nations c ha mpionship': 'TotalEnergies African Nations Championship',
  'fifa world cup': 'FIFA World Cup',
  'fifa club world cup': 'FIFA Club World Cup',
  'copa conmebol libertadores': 'Copa CONMEBOL Libertadores',
  'uefa conference league': 'UEFA Europa Conference League',
  'caf champions league': 'TotalEnergies CAF Champions League',
  'caf confederation cup': 'TotalEnergies CAF Confederation Cup',
  'concacaf champions league': 'Scotiabank CONCACAF Champions League',
  'uefa europa cup': 'UEFA Europa League',
}

function cleanFootballText(value: unknown): string | null {
  const text = normalizeText(value)
  if (!text) return null
  return text
    .replace(/\|c:[^|]+\|[^|]*\|\/c\|/g, '')
    .replace(/[,;]\s*["']+$/g, '')
    .replace(/["'](?=\s+(?:FC|CF|SC|AFC)\b)/gi, '')
    .replace(/(?<=\p{L})["'•]$/u, '')
    .replace(/\s+/g, ' ')
    .trim() || null
}

export function normalizeFootballName(value: unknown): string | null {
  const cleaned = cleanFootballText(value)
  if (!cleaned) return null
  return BUILT_IN_CLUB_NAME_ALIASES[normalizeKey(cleaned)] ?? cleaned
}

export function normalizeCompetitionName(value: unknown): string | null {
  const cleaned = cleanFootballText(value)
  if (!cleaned) return null
  const key = normalizeKey(cleaned)
  const brandedSuperLeague = key.match(/^fifa\s+.+?\s+super league\s+(\d+)$/)
  if (brandedSuperLeague) return `Super League ${brandedSuperLeague[1]}`
  return BUILT_IN_COMPETITION_NAME_ALIASES[key] ?? cleaned
}

export function isRepeatedHeaderRow(row: Record<string, unknown>): boolean {
  const pairs = Object.entries(row).filter(([, value]) => normalizeText(value))
  if (!pairs.length) return false
  const matches = pairs.filter(([key, value]) => normalizeKey(value) === normalizeKey(key.replace(/_\d+$/, '').replace(/_/g, ' '))).length
  return matches >= 2 && matches / pairs.length >= 0.45
}

/**
 * Conservative identity key for clubs. It intentionally keeps suffixes such as
 * FC/SC because removing them merges distinct entities (for example Barcelona
 * and Barcelona S.C., or Suwon and Suwon FC). Known equivalents are handled by
 * the explicit alias table above.
 */
export function clubMatchKey(value: unknown): string {
  return normalizeKey(normalizeFootballName(value))
}

/** Canonical competition key shared by all imports and diagnostics. */
export function competitionMatchKey(value: unknown): string {
  return normalizeKey(normalizeCompetitionName(value))
}
