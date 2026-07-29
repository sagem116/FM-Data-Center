import type { ImportKind, ImportPreview, ImportPreviewRow, RawRow, WorkbookSnapshot } from '../core/types'
import { clubMatchKey, excelSerialToIso, isPlaceholderEntityValue, isRepeatedHeaderRow, normalizeCompetitionName, normalizeFootballName, normalizeKey, normalizeText, parseAppearances, parseInteger, parseMoney, parseNumber, parsePercentage } from '../core/normalizers'
import { isContinentName, normalizeContinentName } from '../../../core/countries'

function cell(row: RawRow, ...aliases: string[]): unknown {
  for (const alias of aliases) {
    const key = normalizeKey(alias).replace(/\s+/g, '_')
    if (key in row) return row[key]
  }
  return null
}


function competitionTypeFromSheet(sheetName: string): 'national' | 'continental' | 'international' | 'super-league' | 'unknown' {
  const key = normalizeKey(sheetName)
  if (key.includes('super league') || key.includes('super leagues') || key.includes('superliga')) return 'super-league'
  if (key.includes('continent')) return 'continental'
  if (key.includes('internacion')) return 'international'
  if (key.includes('nacion')) return 'national'
  return 'unknown'
}

function inferCompetitionType(name:string,country:string|null,continent:string|null,sheetName:string): 'national' | 'continental' | 'international' | 'super-league' | 'unknown' {
  const sheetType=competitionTypeFromSheet(sheetName)
  if(sheetType!=='unknown')return sheetType
  const key=normalizeKey(name)
  const customSuperLeague = /^(?:fifa\s+.+\s+)?super league\s+\d+$/.test(key) || key === 'super league ultimate champion'
  if(customSuperLeague)return 'super-league'

  const nationalTeamPatterns=[
    'world cup','european championship','copa america','finalissima','nations league','liga das nacoes',
    'jogos olimpicos','olympic','fifa confederation cup','taca rous','rous cup','nacoes','nations',
    'waff championship','saff championship','eaff east asian cup','aff suzuki cup','afcon','asian cup',
    'gold cup','copa roca','superclassico das americas','campeonato das caraibas','taca dinastia',
    'taca das nacoes do golfo','torneio das quatro associacoes'
  ]
  if(!key.includes('club world cup') && nationalTeamPatterns.some(pattern=>key.includes(pattern)))return 'international'

  const clubContinentalPatterns=[
    'champions league','libertadores','europa league','conference league','club world cup','caf confederation cup',
    'silver cup','challenge cup','sudamericana','liga dos campeoes','taca dos campeoes','campeonato de clubes',
    'taca dos clubes','vencedores das tacas','taca das tacas','kopa abc','pan pacifico','gold aga khan',
    'superliga sudeste asiatica','fifa super cup','world masters cup'
  ]
  if(clubContinentalPatterns.some(pattern=>key.includes(pattern)))return 'continental'
  if(country)return 'national'
  if(continent)return 'continental'
  return 'unknown'
}
function push(rows: ImportPreviewRow[], sourceSheet: string, index: number, entityKey: string, values: Record<string, unknown>, required: Array<[string, unknown]>, warnings: string[] = []) {
  const errors = required.filter(([, value]) => value === null || value === undefined || value === '').map(([name]) => `Campo obrigatório em falta: ${name}`)
  rows.push({ sourceSheet, sourceRow: index + 2, entityKey, values, warnings, errors })
}

function parseClubs(snapshot: WorkbookSnapshot): ImportPreviewRow[] {
  const merged = new Map<string, Record<string, unknown>>()
  snapshot.sheets.forEach((sheet) => sheet.rows.forEach((row) => {
    if (isRepeatedHeaderRow(row)) return
    const name = normalizeFootballName(cell(row, 'club', 'club name', 'clube', 'nome do clube'))
    if (!name || isPlaceholderEntityValue(name)) return
    const key = clubMatchKey(name)
    const current = merged.get(key) ?? { name }
    const reputation = parseInteger(cell(row, 'reputação', 'reputacao'))
    const currentReputation = parseInteger(current.reputation)
    const mergedReputation = reputation === null ? currentReputation : currentReputation === null ? reputation : Math.max(currentReputation, reputation)
    const averageAttendance = parseInteger(cell(row, 'assistencia media', 'assistência média'))
    const seasonTickets = parseInteger(cell(row, 'detentores de bilhetes de epoca', 'bilhetes de epoca'))
    const finances = parseMoney(cell(row, 'finanças', 'financas')).guaranteed ?? parseNumber(cell(row, 'finanças', 'financas'))
    const wageBudget = parseMoney(cell(row, 'salario', 'salário')).guaranteed ?? parseNumber(cell(row, 'salario', 'salário'))
    const wageUsed = parseMoney(cell(row, 'salario usado', 'salário usado')).guaranteed ?? parseNumber(cell(row, 'salario usado', 'salário usado'))
    const country = normalizeText(cell(row, 'pais', 'país', 'country'))
    const continent = normalizeContinentName(cell(row, 'continente', 'continent')) ?? normalizeText(cell(row, 'continente', 'continent'))
    merged.set(key, { ...current, name: normalizeFootballName(current.name) ?? name, ...(mergedReputation !== null ? { reputation: mergedReputation } : {}), ...(averageAttendance !== null ? { averageAttendance } : {}), ...(seasonTickets !== null ? { seasonTickets } : {}), ...(finances !== null ? { finances } : {}), ...(wageBudget !== null ? { wageBudget } : {}), ...(wageUsed !== null ? { wageUsed } : {}), ...(country ? { country } : {}), ...(continent ? { continent } : {}) })
  }))
  return [...merged.entries()].map(([key, values], index) => ({ sourceSheet: 'folhas combinadas', sourceRow: index + 2, entityKey: key, values, warnings: [], errors: [] }))
}
function parseSimple(snapshot: WorkbookSnapshot, kind: ImportKind): ImportPreviewRow[] {
  const rows: ImportPreviewRow[] = []
  snapshot.sheets.forEach((sheet) => sheet.rows.forEach((row, index) => {
    if (isRepeatedHeaderRow(row)) return
    if (kind === 'competitions') {
      const name = normalizeCompetitionName(cell(row, 'competition', 'competicao', 'competiçao', 'competição'))
      if (!name || isPlaceholderEntityValue(name)) return
      const rawCountry=normalizeText(cell(row,'pais','país','country'))
      const rawContinent=normalizeText(cell(row,'continente','contintente','continent'))
      const locationIsContinent=isContinentName(rawCountry)
      const country=locationIsContinent?null:rawCountry
      const continent=normalizeContinentName(rawContinent) ?? (locationIsContinent?normalizeContinentName(rawCountry):null) ?? rawContinent
      push(rows, sheet.name, index, normalizeKey(name), { name, reputation: parseInteger(cell(row, 'reputacao')), country, continent, competitionType:inferCompetitionType(name,country,continent,sheet.name) }, [['name', name]])
    }
    if (kind === 'coaches') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeFootballName(cell(row, 'nome'))
      if ((!name && !uid) || (name && isPlaceholderEntityValue(name)) || (uid && isPlaceholderEntityValue(uid))) return
      push(rows, sheet.name, index, uid ?? normalizeKey(name), {
        uid, name, nationality: normalizeText(cell(row, 'nac', 'nacionalidade', 'nationality')), club: normalizeFootballName(cell(row, 'clube', 'equipa')), clubRole: normalizeText(cell(row, 'funcao no clube', 'função no clube')), role: normalizeText(cell(row, 'funcao no clube', 'função no clube', 'funcao', 'função')),
        internationalRole: normalizeText(cell(row, 'funcao internacional', 'função internacional')), internationalTeam: (()=>{const fn=normalizeText(cell(row,'funcao','função'));const match=fn?.match(/\((.+?)\)$/i);if(!match)return null;return match[1].replace(/\s+Sub[- ]?\d+s?$/i,'').trim()||null})(),
        unresolvedInternationalAssignment: Boolean(normalizeText(cell(row, 'funcao internacional', 'função internacional')) && !normalizeText(cell(row, 'funcao', 'função'))?.includes('(')),
        contractExpiry: excelSerialToIso(cell(row, 'expira')), winRate: parsePercentage(cell(row, '% vitórias_2', '% vitorias_2', 'vitórias_2', 'vitorias_2', '% vitórias', '% vitorias')),
        titles: parseInteger(cell(row, 'titulos', 'títulos')), raw: row,
      }, [['name', name]])
    }
    if (kind === 'players') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeFootballName(cell(row, 'nome'))
      if ((!name && !uid) || (name && isPlaceholderEntityValue(name)) || (uid && isPlaceholderEntityValue(uid))) return
      push(rows, sheet.name, index, uid ?? normalizeKey(name), {
        uid, name, age: parseInteger(cell(row, 'idade')), club: normalizeFootballName(cell(row, 'clube', 'equipa')), birthDate: excelSerialToIso(cell(row, 'nascimento', 'data nascimento')), marketValue: parseMoney(cell(row, 'vp', 'valor')).guaranteed, wageAnnual: parseMoney(cell(row, 'salario', 'salário')).guaranteed, contractExpiry: excelSerialToIso(cell(row, 'expira')), position: normalizeText(cell(row, 'posicao', 'posição')),
        secondaryPosition: normalizeText(cell(row, 'posicao sec', 'posição sec', 'posição sec.')), nationality: normalizeText(cell(row, 'nac')),
        personality: normalizeText(cell(row, 'personalidade')), rightFoot: normalizeText(cell(row, 'pe direito', 'pé direito')),
        leftFoot: normalizeText(cell(row, 'pe esquerdo', 'pé esquerdo')), raw: row,
      }, [['name', name], ['uid', uid]])
    }
    if (kind === 'transfers') {
      const playerName = normalizeText(cell(row, 'pessoa'))
      if (!playerName || isPlaceholderEntityValue(playerName)) return
      const money = parseMoney(cell(row, 'valor'))
      const date = excelSerialToIso(cell(row, 'data'))
      push(rows, sheet.name, index, `${normalizeKey(playerName)}:${date ?? index}`, {
        playerName, fromClub: normalizeFootballName(cell(row, 'de')), toClub: normalizeFootballName(cell(row, 'para')),
        transferDate: date, fee: money.guaranteed, possibleFee: money.possible, currency: money.currency, rawFee: money.raw,
      }, [['playerName', playerName]])
    }
    if (kind === 'statistics') {
      const uid = normalizeText(cell(row, 'idu'))
      const name = normalizeFootballName(cell(row, 'nome'))
      const competition = normalizeCompetitionName(cell(row, 'competicao', 'competição'))
      if ((!name && !uid) || (name && isPlaceholderEntityValue(name)) || (uid && isPlaceholderEntityValue(uid))) return
      const apps = parseAppearances(cell(row, 'jogos'))
      push(rows, sheet.name, index, `${uid ?? normalizeKey(name)}:${normalizeKey(competition)}:${normalizeKey(sheet.name)}`, {
        uid, name, competition, competitionType: competitionTypeFromSheet(sheet.name), scope: normalizeKey(sheet.name), club: normalizeFootballName(cell(row, 'clube', 'equipa')),
        starts: apps.starts, substituteAppearances: apps.substitute, appearances: apps.total, minutes: parseInteger(cell(row, 'mins', 'minutos')), position: normalizeText(cell(row, 'posicao escolhida', 'posição escolhida', 'posicao', 'posição')),
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
  snapshot.sheets.forEach((sheet) => {
    const competitionType = competitionTypeFromSheet(sheet.name)
    const international = competitionType === 'international'
    sheet.rows.forEach((row, index) => {
      if (isRepeatedHeaderRow(row)) return
      const competition = normalizeCompetitionName(cell(row, 'competicao', 'competição'))
      if (!competition) return
      const team = normalizeFootballName(cell(row, 'equipa'))
      if (team && !isPlaceholderEntityValue(team)) {
        push(rows, sheet.name, index, `${normalizeKey(competition)}:${normalizeKey(team)}`, {
          format: 'league', competition, competitionType, entityKind: 'club', team,
          info: normalizeText(cell(row, 'inf')), position: parseInteger(cell(row, 'pos')), played: parseInteger(cell(row, 'j')),
          wins: parseInteger(cell(row, 'vitoria', 'vitória')), draws: parseInteger(cell(row, 'e')), losses: parseInteger(cell(row, 'd')),
          goalsFor: parseInteger(cell(row, 'gm')), goalsAgainst: parseInteger(cell(row, 'gs')), goalDifference: parseInteger(cell(row, 'dg')), points: parseInteger(cell(row, 'pts')),
        }, [['competition', competition], ['team', team]])
        return
      }

      // Os ficheiros reais usam Equipa 1/Equipa 2 para vencedor/finalista
      // tanto nas competições continentais como internacionais.
      const winner = normalizeFootballName(cell(row, 'equipa 1', 'vencedor'))
      if (!winner || isPlaceholderEntityValue(winner)) return
      const finalist = normalizeFootballName(cell(row, 'equipa 2', 'finalista'))
      const semiFinalists = [cell(row, 'meia final equipa 1'), cell(row, 'meia final equipa 2')].map(normalizeFootballName).filter((value): value is string => Boolean(value))
      const quarterFinalists = [1, 2, 3, 4]
        .map((number) => normalizeFootballName(cell(row, `quartos de final equipa ${number}`)))
        .filter((value): value is string => Boolean(value))

      push(rows, sheet.name, index, normalizeKey(competition), {
        format: 'knockout', competition, competitionType,
        entityKind: international ? 'selection' : 'club',
        winner, finalist, semiFinalists, quarterFinalists,
      }, [['competition', competition], ['winner', winner]])
    })
  })
  return rows
}

export function createPreview(snapshot: WorkbookSnapshot, kind: ImportKind): ImportPreview {
  const rows = kind === 'clubs' ? parseClubs(snapshot) : kind === 'standings' ? parseStandings(snapshot) : parseSimple(snapshot, kind)
  return {
    kind, fileName: snapshot.fileName, rows, totalSourceRows: snapshot.sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    validRows: rows.filter((row) => row.errors.length === 0).length,
    warningRows: rows.filter((row) => row.warnings.length > 0).length,
    errorRows: rows.filter((row) => row.errors.length > 0).length,
    sourceSheets: snapshot.sheets.map((sheet) => sheet.name),
  }
}
