import { useEffect, useMemo, useRef, useState } from 'react'
import { Flag, Search, Shield, Trophy, UserCog, UserRound, X } from 'lucide-react'
import { db } from '../database/db'
import { profileSectionByKind, type EntityKind, useAppNavigation } from './AppNavigationContext'
import { normalizeCountryInput } from '../core/countries/country-normalization'
import { IMPORT_COMPLETED_EVENT } from '../modules/imports/services/import-events'

interface SearchResult { kind: EntityKind; id?: string; name: string; subtitle?: string; related?: boolean }
const icons = { player: UserRound, club: Shield, competition: Trophy, coach: UserCog, country: Flag } as const
const labels = { player: 'Jogador', club: 'Clube', competition: 'Competição', coach: 'Treinador', country: 'País' } as const
const norm = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-PT').replace(/[^a-z0-9]+/g, ' ').trim()
let countryCache: { expiresAt: number; names: string[] } | null = null

async function countryNames(): Promise<string[]> {
  if (countryCache && countryCache.expiresAt > Date.now()) return countryCache.names
  const [clubs, competitions, players, coaches] = await Promise.all([db.clubs.toArray(), db.competitions.toArray(), db.players.toArray(), db.coaches.toArray()])
  const values = new Set<string>()
  for (const value of [...clubs.map((row) => row.country), ...competitions.map((row) => row.country), ...players.map((row) => row.nationality), ...coaches.map((row) => row.nationality)]) {
    if (!value) continue
    values.add(normalizeCountryInput(value).canonicalName ?? value)
  }
  const names = [...values].sort((a, b) => a.localeCompare(b, 'pt-PT'))
  countryCache = { expiresAt: Date.now() + 60_000, names }
  return names
}

async function directSearch(query: string): Promise<SearchResult[]> {
  const key = norm(query)
  if (key.length < 2) return []
  const [players, clubs, competitions, coaches, countries] = await Promise.all([
    db.players.where('normalizedName').startsWithIgnoreCase(key).limit(7).toArray(),
    db.clubs.where('normalizedName').startsWithIgnoreCase(key).limit(7).toArray(),
    db.competitions.where('normalizedName').startsWithIgnoreCase(key).limit(7).toArray(),
    db.coaches.where('normalizedName').startsWithIgnoreCase(key).limit(7).toArray(),
    countryNames(),
  ])
  const matchingCountries = countries.filter((name) => norm(name).startsWith(key) || norm(name).includes(` ${key}`)).slice(0, 7)
  return [
    ...players.map((row) => ({ kind: 'player' as const, id: row.id, name: row.name, subtitle: row.nationality })),
    ...clubs.map((row) => ({ kind: 'club' as const, id: row.id, name: row.name, subtitle: [row.country, row.continent].filter(Boolean).join(' · ') })),
    ...competitions.map((row) => ({ kind: 'competition' as const, id: row.id, name: row.name, subtitle: [row.type, row.country].filter(Boolean).join(' · ') })),
    ...coaches.map((row) => ({ kind: 'coach' as const, id: row.id, name: row.name, subtitle: row.nationality })),
    ...matchingCountries.map((name) => ({ kind: 'country' as const, name })),
  ].slice(0, 24)
}

async function relatedTo(result?: SearchResult): Promise<SearchResult[]> {
  if (!result) return []
  const related: SearchResult[] = []
  if (result.kind === 'player' && result.id) {
    const [player, seasons] = await Promise.all([db.players.get(result.id), db.playerSeasons.where('playerId').equals(result.id).toArray()])
    const latest = seasons.sort((a, b) => b.seasonId.localeCompare(a.seasonId))[0]
    if (latest?.clubId) { const club = await db.clubs.get(latest.clubId); if (club) related.push({ kind: 'club', id: club.id, name: club.name, subtitle: 'Clube relacionado', related: true }) }
    if (player?.nationality) related.push({ kind: 'country', name: normalizeCountryInput(player.nationality).canonicalName ?? player.nationality, subtitle: 'Nacionalidade', related: true })
  }
  if (result.kind === 'club' && result.id) {
    const [club, coachSeasons, standings] = await Promise.all([db.clubs.get(result.id), db.coachSeasons.where('currentClubId').equals(result.id).toArray(), db.standings.where('entityId').equals(result.id).toArray()])
    if (club?.country) related.push({ kind: 'country', name: normalizeCountryInput(club.country).canonicalName ?? club.country, subtitle: 'País do clube', related: true })
    for (const row of coachSeasons.sort((a, b) => b.seasonId.localeCompare(a.seasonId)).slice(0, 2)) { const coach = await db.coaches.get(row.coachId); if (coach) related.push({ kind: 'coach', id: coach.id, name: coach.name, subtitle: 'Treinador relacionado', related: true }) }
    for (const competitionId of [...new Set(standings.map((row) => row.competitionId))].slice(0, 3)) { const competition = await db.competitions.get(competitionId); if (competition) related.push({ kind: 'competition', id: competition.id, name: competition.name, subtitle: 'Competição disputada', related: true }) }
  }
  if (result.kind === 'competition' && result.id) {
    const [competition, standings] = await Promise.all([db.competitions.get(result.id), db.standings.where('competitionId').equals(result.id).toArray()])
    if (competition?.country) related.push({ kind: 'country', name: normalizeCountryInput(competition.country).canonicalName ?? competition.country, subtitle: 'País da competição', related: true })
    for (const clubId of [...new Set(standings.map((row) => row.entityId).filter(Boolean))].slice(0, 4) as string[]) { const club = await db.clubs.get(clubId); if (club) related.push({ kind: 'club', id: club.id, name: club.name, subtitle: 'Participante', related: true }) }
  }
  if (result.kind === 'coach' && result.id) {
    const [coach, seasons] = await Promise.all([db.coaches.get(result.id), db.coachSeasons.where('coachId').equals(result.id).toArray()])
    if (coach?.nationality) related.push({ kind: 'country', name: normalizeCountryInput(coach.nationality).canonicalName ?? coach.nationality, subtitle: 'Nacionalidade', related: true })
    const latest = seasons.sort((a, b) => b.seasonId.localeCompare(a.seasonId))[0]
    if (latest?.currentClubId) { const club = await db.clubs.get(latest.currentClubId); if (club) related.push({ kind: 'club', id: club.id, name: club.name, subtitle: 'Clube atual ou mais recente', related: true }) }
  }
  if (result.kind === 'country') {
    const canonical = normalizeCountryInput(result.name).canonicalName ?? result.name
    const [clubs, coaches, competitions] = await Promise.all([db.clubs.toArray(), db.coaches.toArray(), db.competitions.toArray()])
    related.push(
      ...clubs.filter((row) => normalizeCountryInput(row.country ?? '').canonicalName === canonical).slice(0, 3).map((row) => ({ kind: 'club' as const, id: row.id, name: row.name, subtitle: 'Clube do país', related: true })),
      ...coaches.filter((row) => normalizeCountryInput(row.nationality ?? '').canonicalName === canonical).slice(0, 3).map((row) => ({ kind: 'coach' as const, id: row.id, name: row.name, subtitle: 'Treinador do país', related: true })),
      ...competitions.filter((row) => normalizeCountryInput(row.country ?? '').canonicalName === canonical).slice(0, 2).map((row) => ({ kind: 'competition' as const, id: row.id, name: row.name, subtitle: 'Competição do país', related: true })),
    )
  }
  return related.slice(0, 8)
}

export function GlobalSearch() {
  const { navigate } = useAppNavigation()
  const [query, setQuery] = useState('')
  const [direct, setDirect] = useState<SearchResult[]>([])
  const [related, setRelated] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      if (query.trim().length < 2) { setDirect([]); setRelated([]); setOpen(Boolean(query.trim())); setLoading(false); return }
      setLoading(true)
      void directSearch(query).then(async (rows) => {
        if (cancelled) return
        const relatedRows = await relatedTo(rows[0])
        if (cancelled) return
        setDirect(rows); setRelated(relatedRows); setActive(0); setOpen(true); setLoading(false)
      }).catch(() => { if (!cancelled) setLoading(false) })
    }, 140)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    const clearCache = () => { countryCache = null }
    document.addEventListener('mousedown', close)
    window.addEventListener(IMPORT_COMPLETED_EVENT, clearCache)
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener(IMPORT_COMPLETED_EVENT, clearCache) }
  }, [])
  const rows = useMemo(() => [...direct, ...related.filter((row) => !direct.some((directRow) => directRow.kind === row.kind && directRow.name === row.name))], [direct, related])
  const choose = (row: SearchResult) => { navigate(profileSectionByKind[row.kind], { kind: row.kind, id: row.id, name: row.name }); setQuery(''); setOpen(false) }
  return <div className="global-search" ref={root}>
    <Search size={18} />
    <input value={query} onFocus={() => query && setOpen(true)} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setActive((value) => Math.min(rows.length - 1, value + 1)) } if (event.key === 'ArrowUp') { event.preventDefault(); setActive((value) => Math.max(0, value - 1)) } if (event.key === 'Enter' && rows[active]) choose(rows[active]); if (event.key === 'Escape') setOpen(false) }} placeholder="Pesquisar qualquer entidade…" />
    {query && <button type="button" className="global-search__clear" onClick={() => setQuery('')}><X size={15} /></button>}
    {open && <div className="global-search__results">
      {loading && <p>A procurar entidades e relações…</p>}
      {!loading && rows.map((row, index) => { const Icon = icons[row.kind]; return <button type="button" key={`${row.related ? 'r' : 'd'}:${row.kind}:${row.id ?? row.name}`} className={index === active ? 'is-active' : ''} onMouseEnter={() => setActive(index)} onClick={() => choose(row)}><Icon size={17} /><span><strong>{row.name}</strong><small>{row.related ? 'Relacionado · ' : ''}{labels[row.kind]}{row.subtitle ? ` · ${row.subtitle}` : ''}</small></span></button> })}
      {!loading && query.trim().length < 2 && <p>Escreve pelo menos dois caracteres.</p>}
      {!loading && query.trim().length >= 2 && !rows.length && <p>Sem resultados. Experimenta outro nome ou abreviação.</p>}
    </div>}
  </div>
}
