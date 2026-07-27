import type { ImportKind, WorkbookSnapshot } from './types'
import { normalizeKey } from './normalizers'

const rules: Array<{ kind: ImportKind; score: (snapshot: WorkbookSnapshot) => number }> = [
  { kind: 'statistics', score: (s) => score(s, ['superliga', 'nacional', 'continental', 'internacional'], ['competicao', 'nome', 'jogos', 'idu']) },
  { kind: 'standings', score: (s) => score(s, ['super league', 'ligas nacionais', 'continentais', 'internacionais'], ['equipa', 'vencedor', 'pos']) },
  { kind: 'clubs', score: (s) => score(s, ['reputacao de clubes', 'pais clubes'], ['club name', 'reputacao', 'continente']) },
  { kind: 'coaches', score: (s) => score(s, ['dados treinadores'], ['idu', 'nome', 'funcao no clube']) },
  { kind: 'players', score: (s) => score(s, ['perfil dos jogadores'], ['idu', 'nome', 'posicao', 'idade']) },
  { kind: 'competitions', score: (s) => score(s, ['reputacao competicoes'], ['competicao', 'reputacao']) },
  { kind: 'transfers', score: (s) => score(s, ['resultado combinado'], ['data', 'pessoa', 'de', 'para', 'valor']) },
]

function score(snapshot: WorkbookSnapshot, sheetTokens: string[], headerTokens: string[]): number {
  const sheetNames = snapshot.sheets.map((sheet) => normalizeKey(sheet.name))
  const headers = snapshot.sheets.flatMap((sheet) => sheet.headers.map(normalizeKey))
  return sheetTokens.filter((token) => sheetNames.includes(normalizeKey(token))).length * 3
    + headerTokens.filter((token) => headers.includes(normalizeKey(token))).length
}

export function detectImportKind(snapshot: WorkbookSnapshot): ImportKind | null {
  const ranked = rules.map((rule) => ({ kind: rule.kind, score: rule.score(snapshot) })).sort((a, b) => b.score - a.score)
  return ranked[0]?.score > 1 ? ranked[0].kind : null
}
