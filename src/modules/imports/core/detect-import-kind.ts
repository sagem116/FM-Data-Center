import type { ImportKind, WorkbookSnapshot } from './types'
import { normalizeKey } from './normalizers'

const normalizedHeaders = (headers: string[]) => new Set(headers.map(normalizeKey))
const has = (set: Set<string>, ...values: string[]) => values.some((value) => set.has(normalizeKey(value)))
const count = (set: Set<string>, values: string[]) => values.filter((value) => set.has(normalizeKey(value))).length

/**
 * Detects imports by distinctive column signatures. Sheet names are only used
 * as a final hint because FM reuses names such as "Ligas Nacionais" in
 * standings and player-statistics exports.
 */
export function detectImportKind(snapshot: WorkbookSnapshot): ImportKind | null {
  const sheetHeaders = snapshot.sheets.map((sheet) => normalizedHeaders(sheet.headers))
  const all = new Set(snapshot.sheets.flatMap((sheet) => sheet.headers.map(normalizeKey)))

  // Exact two-column reputation export. This must run before generic standings/statistics checks.
  if (sheetHeaders.some((headers) => headers.size <= 6 && has(headers, 'competition', 'competicao', 'competiçao', 'competição') && has(headers, 'reputacao', 'reputação'))) {
    return 'competitions'
  }

  if (count(all, ['data', 'pessoa', 'de', 'para', 'valor']) >= 4) return 'transfers'

  if (has(all, 'club name', 'club') && count(all, ['reputacao', 'assistencia media', 'pais', 'continente', 'financas', 'salario usado']) >= 2) return 'clubs'

  if (has(all, 'funcao no clube', 'funcao internacional') || count(all, ['jogadores vendidos', 'jogadores contratados', '% vitorias', 'titulos', 'promocoes']) >= 3) {
    return 'coaches'
  }

  if (has(all, 'posicao', 'posicao sec', 'personalidade') && count(all, ['idade', 'altura', 'peso', 'pe direito', 'pe esquerdo', 'nac']) >= 2) {
    return 'players'
  }

  const statisticsSheet = sheetHeaders.some((headers) => {
    const identity = count(headers, ['nome', 'idu', 'jogos', 'competicao', 'equipa', 'clube'])
    const metrics = count(headers, ['gls', 'ast', 'xg', '% passe', 'des/90', 'fnt/90', '% remates', 'cl med', 'c.a.', 'c.p.', 'vp', 'salario'])
    return identity >= 3 && metrics >= 2
  })
  if (statisticsSheet) return 'statistics'

  const leagueSignature = count(all, ['competicao', 'equipa', 'pos', 'pts', 'gm', 'gs'])
  const knockoutSignature = count(all, ['competicao', 'equipa 1', 'equipa 2', 'meia final equipa 1', 'quartos de final equipa 1'])
  if (leagueSignature >= 4 || knockoutSignature >= 4) return 'standings'

  return null
}
