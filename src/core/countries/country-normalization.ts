import { COUNTRY_CATALOG, type CountryCatalogEntry } from './country-catalog'

const ALIAS_OVERRIDE_KEY = 'fm-data-center.country-alias-overrides.v1'
const CONTINENT_OVERRIDE_KEY = 'fm-data-center.country-continent-overrides.v1'
export const COUNTRY_OVERRIDES_EVENT = 'fm-data-center:country-overrides-changed'


const BUILT_IN_FOOTBALL_ALIASES: Record<string, string> = {
  'alg':'Argélia','ang':'Angola','aru':'Aruba','asa':'Samoa Americana','bah':'Baamas','ban':'Bangladeche','ber':'Bermudas','bhu':'Butão','boe':'Países Baixos Caribenhos','bot':'Botsuana','bru':'Brunei','bul':'Bulgária','cam':'Camboja','cay':'Ilhas Caimão','cgo':'Congo-Brazzaville','cha':'Chade','cta':'República Centro-Africana','eqg':'Guiné Equatorial','esw':'Essuatíni','fij':'Fiji','gam':'Gâmbia','grn':'Granada','gui':'Guiné','hai':'Haiti','kuw':'Kuwait','les':'Lesoto','mad':'Madagáscar','mtn':'Mauritânia','mya':'Mianmar (Birmânia)','nep':'Nepal','nig':'Níger','por':'Portugal','rdc':'Congo-Kinshasa','sam':'Samoa','sey':'Seicheles','skn':'São Cristóvão e Neves','smn':'São Marinho','sol':'Ilhas Salomão','sud':'Sudão','tan':'Tanzânia','tog':'Togo','tpe':'Taiwan','van':'Vanuatu','vin':'São Vicente e Granadinas','zam':'Zâmbia','zim':'Zimbabué',
  'e u a':'Estados Unidos','eua':'Estados Unidos','e ua':'Estados Unidos','estados ijnidos':'Estados Unidos',
  'armenia':'Arménia','azerbeijao':'Azerbaijão','bahrein':'Barém','bosnia':'Bósnia e Herzegovina','checia':'Chéquia','egipto':'Egito',
  'emirados':'Emirados Árabes Unidos','emirados unidos':'Emirados Árabes Unidos','emirados arabes':'Emirados Árabes Unidos','emirados arabes unidos':'Emirados Árabes Unidos',
  'rep dominicana':'República Dominicana','uzbequistao':'Uzbequistão','turcomenistao':'Turquemenistão','macau rp china':'Macau, RAE da China','suica':'Suíça',
  'ple':'Territórios palestinianos','lib':'Líbano','pur':'Porto Rico','soviet union':'Rússia',
  'ilhas fiji':'Fiji','mianmar':'Mianmar (Birmânia)','samoa ocidental':'Samoa','bangladexe':'Bangladeche','hong kong rp china':'Hong Kong, RAE da China',
  'arme nia':'Arménia','recia':'Grécia','polon':'Polónia','co m 1a':'Colômbia','ijruguai':'Uruguai','clf':'Maurícia'
}

const CONTINENT_ALIASES: Record<string, string> = {
  'africa':'África','asia':'Ásia','europa':'Europa','oceania':'Oceânia','ocea nia':'Oceânia','america do sul':'América do Sul','america do norte':'América do Norte','america central':'América do Norte'
}
const PLACEHOLDER_COUNTRY_TOKENS = new Set(['pais','nac','continente','country','nationality'])

export interface CountryResolution {
  input: string
  normalizedInput: string
  status: 'resolved' | 'override' | 'ambiguous' | 'unknown'
  canonical?: string
  english?: string
  alpha2?: string
  alpha3?: string
  continent?: string
  candidates?: string[]
}

export interface CountryAliasOverride {
  canonical: string
  continent?: string
}

type AliasOverrides = Record<string, CountryAliasOverride>
type ContinentOverrides = Record<string, string>
let aliasOverrideCache: AliasOverrides | undefined
let continentOverrideCache: ContinentOverrides | undefined

export function normalizeCountryToken(value: unknown): string {
  return String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-PT')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function readJson<T extends object>(key: string): T {
  if (typeof window === 'undefined') return {} as T
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return {} as T
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as T : {} as T
  } catch {
    return {} as T
  }
}

function writeJson(key: string, value: object): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(COUNTRY_OVERRIDES_EVENT))
}

const aliasIndex = new Map<string, CountryCatalogEntry[]>()
const canonicalIndex = new Map<string, CountryCatalogEntry>()
for (const entry of COUNTRY_CATALOG) {
  canonicalIndex.set(normalizeCountryToken(entry.canonical), entry)
  const aliases = new Set([entry.canonical, entry.english, entry.alpha2, entry.alpha3, ...entry.aliases])
  for (const alias of aliases) {
    const key = normalizeCountryToken(alias)
    if (!key) continue
    const rows = aliasIndex.get(key) ?? []
    if (!rows.some((row) => row.canonical === entry.canonical)) rows.push(entry)
    aliasIndex.set(key, rows)
  }
}

export function getCountryAliasOverrides(): AliasOverrides {
  return aliasOverrideCache ?? (aliasOverrideCache = readJson<AliasOverrides>(ALIAS_OVERRIDE_KEY))
}

export function getCountryContinentOverrides(): ContinentOverrides {
  return continentOverrideCache ?? (continentOverrideCache = readJson<ContinentOverrides>(CONTINENT_OVERRIDE_KEY))
}

export function setCountryAliasOverride(alias: string, canonical: string, continent?: string): void {
  const key = normalizeCountryToken(alias)
  if (!key || !canonical.trim()) return
  const overrides = getCountryAliasOverrides()
  overrides[key] = { canonical: canonical.trim(), ...(continent?.trim() ? { continent: continent.trim() } : {}) }
  aliasOverrideCache = overrides
  writeJson(ALIAS_OVERRIDE_KEY, overrides)
}

export function removeCountryAliasOverride(alias: string): void {
  const key = normalizeCountryToken(alias)
  const overrides = getCountryAliasOverrides()
  delete overrides[key]
  aliasOverrideCache = overrides
  writeJson(ALIAS_OVERRIDE_KEY, overrides)
}

export function setCountryContinentOverride(country: string, continent: string): void {
  const key = normalizeCountryToken(country)
  if (!key || !continent.trim()) return
  const overrides = getCountryContinentOverrides()
  overrides[key] = continent.trim()
  continentOverrideCache = overrides
  writeJson(CONTINENT_OVERRIDE_KEY, overrides)
}

export function removeCountryContinentOverride(country: string): void {
  const key = normalizeCountryToken(country)
  const overrides = getCountryContinentOverrides()
  delete overrides[key]
  continentOverrideCache = overrides
  writeJson(CONTINENT_OVERRIDE_KEY, overrides)
}

export function resolveCountry(value: unknown): CountryResolution {
  const input = String(value ?? '').trim()
  const normalizedInput = normalizeCountryToken(input)
  if (!normalizedInput) return { input, normalizedInput, status: 'unknown' }

  if (PLACEHOLDER_COUNTRY_TOKENS.has(normalizedInput)) return { input, normalizedInput, status: 'unknown' }

  const builtInCanonical = BUILT_IN_FOOTBALL_ALIASES[normalizedInput]
  if (builtInCanonical) {
    const catalog = canonicalIndex.get(normalizeCountryToken(builtInCanonical))
    return { input, normalizedInput, status: 'resolved', canonical: builtInCanonical, english: catalog?.english, alpha2: catalog?.alpha2, alpha3: catalog?.alpha3, continent: catalog?.continent }
  }

  const aliasOverride = getCountryAliasOverrides()[normalizedInput]
  if (aliasOverride) {
    const catalog = canonicalIndex.get(normalizeCountryToken(aliasOverride.canonical))
    const continentOverride = getCountryContinentOverrides()[normalizeCountryToken(aliasOverride.canonical)]
    return {
      input,
      normalizedInput,
      status: 'override',
      canonical: aliasOverride.canonical,
      english: catalog?.english,
      alpha2: catalog?.alpha2,
      alpha3: catalog?.alpha3,
      continent: aliasOverride.continent ?? continentOverride ?? catalog?.continent,
    }
  }

  const candidates = aliasIndex.get(normalizedInput) ?? []
  if (candidates.length === 1) {
    const entry = candidates[0]
    const continent = getCountryContinentOverrides()[normalizeCountryToken(entry.canonical)] ?? entry.continent
    return { input, normalizedInput, status: 'resolved', canonical: entry.canonical, english: entry.english, alpha2: entry.alpha2, alpha3: entry.alpha3, continent }
  }
  if (candidates.length > 1) {
    return { input, normalizedInput, status: 'ambiguous', candidates: candidates.map((entry) => entry.canonical).sort() }
  }
  return { input, normalizedInput, status: 'unknown' }
}

export function normalizeCountryName(value: unknown): string | undefined {
  const token = normalizeCountryToken(value)
  if (!token || PLACEHOLDER_COUNTRY_TOKENS.has(token)) return undefined
  const resolution = resolveCountry(value)
  return resolution.canonical ?? (String(value ?? '').trim() || undefined)
}


export function normalizeContinentName(value: unknown): string | undefined {
  const key = normalizeCountryToken(value)
  return CONTINENT_ALIASES[key]
}

export function isContinentName(value: unknown): boolean {
  return Boolean(normalizeContinentName(value))
}

export function resolveContinent(country: unknown, explicitContinent?: unknown): string | undefined {
  const explicit = normalizeContinentName(explicitContinent) ?? String(explicitContinent ?? '').trim()
  const countryResolution = resolveCountry(country)
  if (countryResolution.canonical) {
    const manual = getCountryContinentOverrides()[normalizeCountryToken(countryResolution.canonical)]
    if (manual) return manual
  }
  return (PLACEHOLDER_COUNTRY_TOKENS.has(normalizeCountryToken(explicit)) ? undefined : explicit) || countryResolution.continent
}

export function listCountryCatalog(): CountryCatalogEntry[] {
  return COUNTRY_CATALOG
}

export function listCountryAliases(): Array<{ alias: string; canonical: string; continent: string; source: 'built-in' | 'override' }> {
  const result = new Map<string, { alias: string; canonical: string; continent: string; source: 'built-in' | 'override' }>()
  for (const entry of COUNTRY_CATALOG) {
    for (const alias of new Set([entry.alpha2, entry.alpha3, entry.english, entry.canonical, ...entry.aliases])) {
      const key = normalizeCountryToken(alias)
      if (!key || result.has(key)) continue
      result.set(key, { alias, canonical: entry.canonical, continent: entry.continent, source: 'built-in' })
    }
  }
  for (const [alias, override] of Object.entries(getCountryAliasOverrides())) {
    const entry = canonicalIndex.get(normalizeCountryToken(override.canonical))
    result.set(alias, { alias, canonical: override.canonical, continent: override.continent ?? entry?.continent ?? 'Desconhecido', source: 'override' })
  }
  return [...result.values()].sort((a, b) => a.alias.localeCompare(b.alias, 'pt-PT'))
}

export function subscribeCountryOverrides(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined
  const listener = () => callback()
  window.addEventListener(COUNTRY_OVERRIDES_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(COUNTRY_OVERRIDES_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

/** Compatibility helper for UI modules that need a small normalized-country object. */
export function normalizeCountryInput(value: unknown): { canonicalName?: string; continent?: string; status: CountryResolution['status'] } {
  const resolution = resolveCountry(value)
  return { canonicalName: resolution.canonical ?? normalizeCountryName(value), continent: resolution.continent, status: resolution.status }
}
