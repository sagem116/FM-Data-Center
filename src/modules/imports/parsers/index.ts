import type { ImportKind, ImportPreview, ImportPreviewRow, RawRow, WorkbookSnapshot } from '../core/types'
import { excelSerialToIso, normalizeKey, normalizeText, parseAppearances, parseInteger, parseMoney, parseNumber, parsePercentage } from '../core/normalizers'

function cell(row: RawRow, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    const key = normalizeKey(alias).replace(/\s+/g, '_')
    if (key in row) return row[key]
  }
  return null
}

function push(rows: ImportPreviewRow[], sourceSheet: string, index: number, entityKey: string, values: Record<string, unknown>, required: Array<[string, unknown]>) {
  const errors = required.filter(([, value]) => value === null || value === undefined || value === '').map(([name]) => `Campo obrigatório em falta: ${name}`)
  rows.push({ sourceSheet, sourceRow: index + 2, entityKey, values, warnings: [], errors })
}

function parseClubs(snapshot: WorkbookSnapshot): ImportPreviewRow[] {
  const merged = new Map<string, Record<string, unknown>>()
  snapshot.sheets.forEach((sheet) => sheet.rows.forEach((row) => {
    const name = normalizeText(cell(row, 'club name'))
    if (!name) return
    const key = normalizeKey(name)
    const current = merged.get(key) ?? { name }
    const reputation = parseInteger(cell(row, 'reputação'))
    const averageAttendance = parseInteger(cell(row, 'assistencia media'))
    const seasonTickets = parseInteger(cell(row, 'detentores de bilhetes de epoca'))
    const country = normalizeText(cell(row, 'pais'))
    const continent = normalizeText(cell(row, 'continente'))
    merged.set(key, { ...current, ...(reputation !== null ? { reputation } : {}), ...(averageAttendance !== null ? { averageAttendance } : {}), ...(seasonTickets !== null ? { seasonTickets } : {}), ...(country ? { country } : {}), ...(continent ? { continent } : {}) })
  }))
  return [...merged.entries()].map(([key, values], index) => ({ sourceSheet: 'folhas combinadas', sourceRow: index + 2, entityKey: key, values, warnings: [], errors: [] }))
}

function parseSimple(snapshot: WorkbookSnapshot, kind: ImportKind): ImportPreviewRow[] {
  const rows: ImportPreviewRow[] = []
  snapshot.sheets.forEach((sheet) => sheet.rows.forEach((row, index) => {
    if (kind === 'competitions') {
      const name = normalizeText(cell(row, 'competicao', 'competiçao', 'competição'))
      if (!name) return
      push(rows, sheet.name, index, normalizeKey(name), { name, reputation: parseInteger(cell(row, 'reputacao')) }, [['name', name]])
    }
    if (kind === 'coaches') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeText(cell(row, 'nome'))
      if (!name && !uid) return
      push(rows, sheet.name, index, uid ?? normalizeKey(name), {
        uid, name, club: normalizeText(cell(row, 'clube')), role: normalizeText(cell(row, 'funcao no clube', 'função no clube', 'funcao', 'função')),
        contractExpiry: excelSerialToIso(cell(row, 'expira')), winRate: parsePercentage(cell(row, 'vitórias_2', 'vitorias_2', '% vitórias_2', '% vitorias_2', '% vitórias', 'vitórias')),
        titles: parseInteger(cell(row, 'titulos', 'títulos')), raw: row,
      }, [['name', name]])
    }
    if (kind === 'players') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeText(cell(row, 'nome'))
      if (!name && !uid) return
      push(rows, sheet.name, index, uid ?? normalizeKey(name), {
        uid, name, age: parseInteger(cell(row, 'idade')), club: normalizeText(cell(row, 'clube')), birthDate: excelSerialToIso(cell(row, 'nascimento', 'data nascimento')), marketValue: parseMoney(cell(row, 'vp', 'valor')).guaranteed, wageAnnual: parseMoney(cell(row, 'salario', 'salário')).guaranteed, contractExpiry: excelSerialToIso(cell(row, 'expira')), position: normalizeText(cell(row, 'posicao', 'posição')),
        secondaryPosition: normalizeText(cell(row, 'posicao sec', 'posição sec', 'posição sec.')), nationality: normalizeText(cell(row, 'nac')),
        personality: normalizeText(cell(row, 'personalidade')), rightFoot: normalizeText(cell(row, 'pe direito', 'pé direito')),
        leftFoot: normalizeText(cell(row, 'pe esquerdo', 'pé esquerdo')), raw: row,
      }, [['name', name], ['uid', uid]])
    }
    if (kind === 'transfers') {
      const playerName = normalizeText(cell(row, 'pessoa'))
      if (!playerName) return
      const money = parseMoney(cell(row, 'valor'))
      const date = excelSerialToIso(cell(row, 'data'))
      push(rows, sheet.name, index, `${normalizeKey(playerName)}:${date ?? index}`, {
        playerName, fromClub: normalizeText(cell(row, 'de')), toClub: normalizeText(cell(row, 'para')),
        transferDate: date, fee: money.guaranteed, possibleFee: money.possible, currency: money.currency, rawFee: money.raw,
      }, [['playerName', playerName]])
    }
    if (kind === 'statistics') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeText(cell(row, 'nome'))
      const competition = normalizeText(cell(row, 'competicao', 'competição'))
      if (!name && !uid) return
      const apps = parseAppearances(cell(row, 'jogos'))
      push(rows, sheet.name, index, `${uid ?? normalizeKey(name)}:${normalizeKey(competition)}:${normalizeKey(sheet.name)}`, {
        uid, name, competition, scope: normalizeKey(sheet.name), club: normalizeText(cell(row, 'clube')),
        starts: apps.starts, substituteAppearances: apps.substitute, appearances: apps.total,
        goals: parseInteger(cell(row, 'gls')) ?? 0, assists: parseInteger(cell(row, 'ast')) ?? 0,
        xg: parseNumber(cell(row, 'xg')), passCompletion: parsePercentage(cell(row, '% passe', 'passe')),
        tacklesPer90: parseNumber(cell(row, 'des 90', 'des/90')), averageRating: parseNumber(cell(row, 'cl med')),
        currentAbility: parseNumber(cell(row, 'c a', 'c.a.')), potentialAbility: parseNumber(cell(row, 'c p', 'c.p.')),
        marketValue: parseMoney(cell(row, 'vp')).guaranteed, wageAnnual: parseMoney(cell(row, 'salario', 'salário')).guaranteed,
        age: parseInteger(cell(row, 'idade')), nationality: normalizeText(cell(row, 'nac')), raw: row,
      }, [['name', name], ['competition', competition]])
    }
  }))
  return rows
}

function parseStandings(snapshot: WorkbookSnapshot): ImportPreviewRow[] {
  const rows: ImportPreviewRow[] = []
  snapshot.sheets.forEach((sheet) => sheet.rows.forEach((row, index) => {
    const competition = normalizeText(cell(row, 'competicao', 'competição'))
    if (!competition) return
    const team = normalizeText(cell(row, 'equipa'))
    if (team) {
      push(rows, sheet.name, index, `${normalizeKey(competition)}:${normalizeKey(team)}`, {
        format: 'league', competition, team, position: parseInteger(cell(row, 'pos')), played: parseInteger(cell(row, 'j')),
        wins: parseInteger(cell(row, 'vitoria', 'vitória')), draws: parseInteger(cell(row, 'e')), losses: parseInteger(cell(row, 'd')),
        goalsFor: parseInteger(cell(row, 'gm')), goalsAgainst: parseInteger(cell(row, 'gs')), goalDifference: parseInteger(cell(row, 'dg')), points: parseInteger(cell(row, 'pts')),
      }, [['competition', competition], ['team', team]])
      return
    }
    const winner = normalizeText(cell(row, 'vencedor'))
    if (!winner) return
    push(rows, sheet.name, index, normalizeKey(competition), {
      format: 'knockout', competition, winner, finalist: normalizeText(cell(row, 'finalista')),
      semiFinalists: [cell(row, 'meia final equipa 1'), cell(row, 'meia final equipa 2')].map(normalizeText).filter(Boolean),
      quarterFinalists: [1,2,3,4].map((n) => normalizeText(cell(row, `quartos de final equipa ${n}`))).filter(Boolean),
      extraTeam: normalizeText(cell(row, 'equipa 1')),
    }, [['competition', competition], ['winner', winner]])
  }))
  return rows
}

export function createPreview(snapshot: WorkbookSnapshot, kind: ImportKind): ImportPreview {
  const rows = kind === 'clubs' ? parseClubs(snapshot) : kind === 'standings' ? parseStandings(snapshot) : parseSimple(snapshot, kind)
  return {
    kind, fileName: snapshot.fileName, rows, totalSourceRows: snapshot.sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    validRows: rows.filter((row) => row.errors.length === 0).length,
    warningRows: rows.filter((row) => row.warnings.length > 0).length,
    errorRows: rows.filter((row) => row.errors.length > 0).length,
  }
}
