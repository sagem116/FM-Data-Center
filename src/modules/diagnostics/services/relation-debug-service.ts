import { db } from '../../../database/db'
import { normalizeCountryToken, resolveCountry } from '../../../core/countries'
import { normalizeKey } from '../../imports/core/normalizers'

export type RelationDebugSeverity = 'error' | 'warning' | 'info'
export type RelationTable = 'playerSeasons' | 'playerAttributes' | 'playerGeneralMetrics' | 'playerCompetitionStats' | 'clubSeasons' | 'competitionSeasons' | 'coachSeasons' | 'standings' | 'transfers' | 'importSessions'

export interface RelationDebugIssue {
  id: string
  severity: RelationDebugSeverity
  code: string
  title: string
  detail: string
  table?: RelationTable
  recordId?: string
  relatedId?: string
  editable: boolean
  action?: 'delete' | 'sync-name' | 'create-player-season' | 'create-club-season'
}

export interface RelationDebugSnapshot {
  generatedAt: string
  summary: {
    issues: number
    errors: number
    warnings: number
    orphanRecords: number
    nameConflicts: number
    missingSeasonLinks: number
    identityConflicts: number
    invalidValues: number
  }
  issues: RelationDebugIssue[]
  tableCounts: Array<{ table: string; records: number; issues: number }>
}

export async function collectRelationDebug(): Promise<RelationDebugSnapshot> {
  const [seasons, players, playerSeasons, attributes, generalMetrics, stats, clubs, clubSeasons, competitions, competitionSeasons, coaches, coachSeasons, standings, transfers, importSessions] = await Promise.all([
    db.seasons.toArray(), db.players.toArray(), db.playerSeasons.toArray(), db.playerAttributes.toArray(), db.playerGeneralMetrics.toArray(), db.playerCompetitionStats.toArray(), db.clubs.toArray(), db.clubSeasons.toArray(), db.competitions.toArray(), db.competitionSeasons.toArray(), db.coaches.toArray(), db.coachSeasons.toArray(), db.standings.toArray(), db.transfers.toArray(), db.importSessions.toArray(),
  ])
  const seasonIds = new Set(seasons.map((row) => row.id))
  const playerMap = new Map(players.map((row) => [row.id, row]))
  const clubMap = new Map(clubs.map((row) => [row.id, row]))
  const competitionMap = new Map(competitions.map((row) => [row.id, row]))
  const coachMap = new Map(coaches.map((row) => [row.id, row]))
  const playerSeasonKeys = new Set(playerSeasons.map((row) => `${row.playerId}::${row.seasonId}`))
  const clubSeasonKeys = new Set(clubSeasons.map((row) => `${row.clubId}::${row.seasonId}`))
  const issues: RelationDebugIssue[] = []
  const add = (issue: RelationDebugIssue) => issues.push(issue)

  const uidGroups = <T extends { id: string; uid?: string; name: string }>(rows: T[], type: 'PLAYER' | 'CLUB' | 'COACH') => {
    const map = new Map<string, T[]>()
    for (const row of rows) if (row.uid) { const list = map.get(row.uid) ?? []; list.push(row); map.set(row.uid, list) }
    for (const [uid, list] of map) if (list.length > 1) add({ id: `${type.toLowerCase()}-uid:${uid}`, severity: 'error', code: `${type}_UID_DUPLICATE`, title: `${type === 'PLAYER' ? 'Jogador' : type === 'CLUB' ? 'Clube' : 'Treinador'} com UID duplicado`, detail: `${uid}: ${list.map((row) => row.name).join(', ')}`, editable: false })
  }
  uidGroups(players, 'PLAYER'); uidGroups(clubs, 'CLUB'); uidGroups(coaches, 'COACH')

  const playerIdentityGroups = new Map<string, typeof players>()
  for (const row of players) { const list = playerIdentityGroups.get(row.identityKey) ?? []; list.push(row); playerIdentityGroups.set(row.identityKey, list) }
  for (const [key, list] of playerIdentityGroups) if (list.length > 1) add({ id: `player-identity:${key}`, severity: 'error', code: 'PLAYER_IDENTITY_DUPLICATE', title: 'Identidade de jogador duplicada', detail: list.map((row) => row.name).join(', '), editable: false })

  for (const row of playerSeasons) {
    if (!playerMap.has(row.playerId)) add({ id: `ps-player:${row.id}`, severity: 'error', code: 'PLAYER_SEASON_ORPHAN_PLAYER', title: 'Época de jogador sem jogador', detail: row.id, table: 'playerSeasons', recordId: row.id, editable: true, action: 'delete' })
    if (!seasonIds.has(row.seasonId)) add({ id: `ps-season:${row.id}`, severity: 'error', code: 'PLAYER_SEASON_ORPHAN_SEASON', title: 'Época de jogador sem época', detail: `${row.id} → ${row.seasonId}`, table: 'playerSeasons', recordId: row.id, editable: true, action: 'delete' })
    if (row.clubId && !clubMap.has(row.clubId)) add({ id: `ps-club:${row.id}`, severity: 'error', code: 'PLAYER_SEASON_ORPHAN_CLUB', title: 'Época de jogador sem clube válido', detail: `${row.id} → ${row.clubId}`, table: 'playerSeasons', recordId: row.id, editable: true, action: 'delete' })
    if (row.clubId && clubMap.has(row.clubId) && row.clubName && normalizeKey(row.clubName) !== normalizeKey(clubMap.get(row.clubId)!.name)) add({ id: `ps-name:${row.id}`, severity: 'warning', code: 'PLAYER_SEASON_CLUB_NAME_CONFLICT', title: 'Nome do clube divergente no jogador', detail: `${row.clubName} vs ${clubMap.get(row.clubId)!.name}`, table: 'playerSeasons', recordId: row.id, editable: true, action: 'sync-name' })
  }
  for (const row of attributes) {
    if (!playerMap.has(row.playerId) || !seasonIds.has(row.seasonId)) add({ id: `attr:${row.id}`, severity: 'error', code: 'ATTRIBUTES_ORPHAN', title: 'Atributos órfãos', detail: row.id, table: 'playerAttributes', recordId: row.id, editable: true, action: 'delete' })
  }
  for (const row of generalMetrics) {
    if (!playerMap.has(row.playerId) || !seasonIds.has(row.seasonId)) add({ id: `metrics:${row.id}`, severity: 'error', code: 'GENERAL_METRICS_ORPHAN', title: 'Métricas gerais órfãs', detail: row.id, table: 'playerGeneralMetrics', recordId: row.id, editable: true, action: 'delete' })
  }
  for (const row of stats) {
    if (!playerMap.has(row.playerId)) add({ id: `stats-player:${row.id}`, severity: 'error', code: 'STATS_ORPHAN_PLAYER', title: 'Estatística sem jogador', detail: row.id, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'delete' })
    if (!seasonIds.has(row.seasonId)) add({ id: `stats-season:${row.id}`, severity: 'error', code: 'STATS_ORPHAN_SEASON', title: 'Estatística sem época', detail: row.id, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'delete' })
    if (!competitionMap.has(row.competitionId)) add({ id: `stats-comp:${row.id}`, severity: 'error', code: 'STATS_ORPHAN_COMPETITION', title: 'Estatística sem competição', detail: `${row.competitionName} → ${row.competitionId}`, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'delete' })
    if (row.clubId && !clubMap.has(row.clubId)) add({ id: `stats-club:${row.id}`, severity: 'error', code: 'STATS_ORPHAN_CLUB', title: 'Estatística sem clube', detail: row.clubId, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'delete' })
    if (!playerSeasonKeys.has(`${row.playerId}::${row.seasonId}`)) add({ id: `stats-no-player-season:${row.id}`, severity: 'warning', code: 'STATS_WITHOUT_PLAYER_SEASON', title: 'Estatística sem perfil de época do jogador', detail: `${playerMap.get(row.playerId)?.name ?? row.playerId} em ${row.seasonId}.`, table: 'playerCompetitionStats', recordId: row.id, relatedId: row.playerId, editable: true, action: 'create-player-season' })
    const competition = competitionMap.get(row.competitionId)
    if (competition && normalizeKey(row.competitionName) !== normalizeKey(competition.name)) add({ id: `stats-comp-name:${row.id}`, severity: 'warning', code: 'STATS_COMPETITION_NAME_CONFLICT', title: 'Nome da competição divergente', detail: `${row.competitionName} vs ${competition.name}`, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'sync-name' })
    const club = row.clubId ? clubMap.get(row.clubId) : undefined
    if (club && row.clubName && normalizeKey(row.clubName) !== normalizeKey(club.name)) add({ id: `stats-club-name:${row.id}`, severity: 'warning', code: 'STATS_CLUB_NAME_CONFLICT', title: 'Nome do clube divergente nas estatísticas', detail: `${row.clubName} vs ${club.name}`, table: 'playerCompetitionStats', recordId: row.id, editable: true, action: 'sync-name' })
    if (row.minutes < 0 || row.appearances < 0 || row.goals < 0 || row.assists < 0) add({ id: `stats-invalid:${row.id}`, severity: 'error', code: 'STATS_INVALID_NEGATIVE_VALUE', title: 'Valores estatísticos negativos', detail: `${row.competitionName}: jogos ${row.appearances}, minutos ${row.minutes}, golos ${row.goals}, assistências ${row.assists}.`, table: 'playerCompetitionStats', recordId: row.id, editable: false })
  }
  for (const row of clubSeasons) {
    if (!clubMap.has(row.clubId) || !seasonIds.has(row.seasonId)) add({ id: `club-season:${row.id}`, severity: 'error', code: 'CLUB_SEASON_ORPHAN', title: 'Registo de época de clube órfão', detail: row.id, table: 'clubSeasons', recordId: row.id, editable: true, action: 'delete' })
  }
  for (const row of competitionSeasons) {
    if (!competitionMap.has(row.competitionId) || !seasonIds.has(row.seasonId)) add({ id: `competition-season:${row.id}`, severity: 'error', code: 'COMPETITION_SEASON_ORPHAN', title: 'Registo de época de competição órfão', detail: row.id, table: 'competitionSeasons', recordId: row.id, editable: true, action: 'delete' })
  }
  for (const row of coachSeasons) {
    if (!coachMap.has(row.coachId)) add({ id: `coach-season-coach:${row.id}`, severity: 'error', code: 'COACH_SEASON_ORPHAN_COACH', title: 'Época de treinador sem treinador', detail: row.id, table: 'coachSeasons', recordId: row.id, editable: true, action: 'delete' })
    if (!seasonIds.has(row.seasonId)) add({ id: `coach-season-season:${row.id}`, severity: 'error', code: 'COACH_SEASON_ORPHAN_SEASON', title: 'Época de treinador sem época', detail: row.id, table: 'coachSeasons', recordId: row.id, editable: true, action: 'delete' })
    if (row.currentClubId && !row.currentClubId.startsWith('country:') && !clubMap.has(row.currentClubId)) add({ id: `coach-season-club:${row.id}`, severity: 'error', code: 'COACH_SEASON_ORPHAN_CLUB', title: 'Treinador ligado a clube inexistente', detail: `${row.currentClubName ?? '—'} → ${row.currentClubId}`, table: 'coachSeasons', recordId: row.id, editable: true, action: 'delete' })
    const club = row.currentClubId ? clubMap.get(row.currentClubId) : undefined
    if (club && row.currentClubName && normalizeKey(row.currentClubName) !== normalizeKey(club.name)) add({ id: `coach-season-name:${row.id}`, severity: 'warning', code: 'COACH_SEASON_CLUB_NAME_CONFLICT', title: 'Nome do clube divergente no treinador', detail: `${row.currentClubName} vs ${club.name}`, table: 'coachSeasons', recordId: row.id, editable: true, action: 'sync-name' })
    if (row.currentClubId?.startsWith('country:') && row.currentClubName && normalizeCountryToken(row.currentClubName) !== row.currentClubId.replace(/^country:/, '')) add({ id: `coach-selection-name:${row.id}`, severity: 'warning', code: 'COACH_SELECTION_NAME_CONFLICT', title: 'Nome da seleção divergente', detail: `${row.currentClubName} vs ${row.currentClubId}`, table: 'coachSeasons', recordId: row.id, editable: true, action: 'sync-name' })
  }
  for (const row of standings) {
    if (!seasonIds.has(row.seasonId)) add({ id: `standing-season:${row.id}`, severity: 'error', code: 'STANDING_ORPHAN_SEASON', title: 'Classificação sem época', detail: row.id, table: 'standings', recordId: row.id, editable: true, action: 'delete' })
    if (!competitionMap.has(row.competitionId)) add({ id: `standing-comp:${row.id}`, severity: 'error', code: 'STANDING_ORPHAN_COMPETITION', title: 'Classificação sem competição', detail: row.id, table: 'standings', recordId: row.id, editable: true, action: 'delete' })
    if (row.entityId && !row.entityId.startsWith('country:') && !clubMap.has(row.entityId)) add({ id: `standing-entity:${row.id}`, severity: 'error', code: 'STANDING_ORPHAN_ENTITY', title: 'Classificação ligada a entidade inexistente', detail: `${row.entityName} → ${row.entityId}`, table: 'standings', recordId: row.id, editable: true, action: 'delete' })
    const competition = competitionMap.get(row.competitionId)
    if (competition && normalizeKey(row.competitionName) !== normalizeKey(competition.name)) add({ id: `standing-comp-name:${row.id}`, severity: 'warning', code: 'STANDING_COMPETITION_NAME_CONFLICT', title: 'Nome da competição divergente na classificação', detail: `${row.competitionName} vs ${competition.name}`, table: 'standings', recordId: row.id, editable: true, action: 'sync-name' })
    const club = row.entityId ? clubMap.get(row.entityId) : undefined
    if (club && normalizeKey(row.entityName) !== normalizeKey(club.name)) add({ id: `standing-club-name:${row.id}`, severity: 'warning', code: 'STANDING_CLUB_NAME_CONFLICT', title: 'Nome do clube divergente na classificação', detail: `${row.entityName} vs ${club.name}`, table: 'standings', recordId: row.id, editable: true, action: 'sync-name' })
  }
  for (const row of transfers) {
    if (!seasonIds.has(row.seasonId)) add({ id: `transfer-season:${row.id}`, severity: 'error', code: 'TRANSFER_ORPHAN_SEASON', title: 'Transferência sem época', detail: row.id, table: 'transfers', recordId: row.id, editable: true, action: 'delete' })
    if (row.playerId && !playerMap.has(row.playerId)) add({ id: `transfer-player:${row.id}`, severity: 'warning', code: 'TRANSFER_ORPHAN_PLAYER', title: 'Transferência sem jogador válido', detail: row.playerName, table: 'transfers', recordId: row.id, editable: true, action: 'delete' })
    if (row.fromClubId && !clubMap.has(row.fromClubId)) add({ id: `transfer-from:${row.id}`, severity: 'error', code: 'TRANSFER_ORPHAN_FROM_CLUB', title: 'Transferência com clube de origem inexistente', detail: row.fromClubName ?? row.fromClubId, table: 'transfers', recordId: row.id, editable: true, action: 'delete' })
    if (row.toClubId && !clubMap.has(row.toClubId)) add({ id: `transfer-to:${row.id}`, severity: 'error', code: 'TRANSFER_ORPHAN_TO_CLUB', title: 'Transferência com clube de destino inexistente', detail: row.toClubName ?? row.toClubId, table: 'transfers', recordId: row.id, editable: true, action: 'delete' })
    if (row.fromClubId && row.fromClubId === row.toClubId) add({ id: `transfer-self:${row.id}`, severity: 'warning', code: 'TRANSFER_SAME_CLUB', title: 'Transferência entre o mesmo clube', detail: `${row.playerName}: ${row.fromClubName ?? row.fromClubId}.`, table: 'transfers', recordId: row.id, editable: true, action: 'delete' })
  }
  for (const row of importSessions) if (!seasonIds.has(row.seasonId)) add({ id: `import-season:${row.id}`, severity: 'error', code: 'IMPORT_SESSION_ORPHAN_SEASON', title: 'Importação ligada a época inexistente', detail: `${row.fileName} → ${row.seasonId}`, table: 'importSessions', recordId: row.id, editable: true, action: 'delete' })

  const missingClubSeasonRelations = new Set(playerSeasons.filter((row) => row.clubId && !clubSeasonKeys.has(`${row.clubId}::${row.seasonId}`)).map((row) => `${row.clubId}::${row.seasonId}`))
  for (const relation of missingClubSeasonRelations) { const [clubId, seasonId] = relation.split('::'); add({ id: `missing-club-season:${relation}`, severity: 'info', code: 'ACTIVE_CLUB_WITHOUT_CLUB_SEASON', title: 'Clube ativo sem registo de época', detail: `${clubMap.get(clubId)?.name ?? clubId} em ${seasonId}.`, table: 'clubSeasons', relatedId: relation, editable: true, action: 'create-club-season' }) }

  const tableRecordCounts: Record<RelationTable, number> = { playerSeasons: playerSeasons.length, playerAttributes: attributes.length, playerGeneralMetrics: generalMetrics.length, playerCompetitionStats: stats.length, clubSeasons: clubSeasons.length, competitionSeasons: competitionSeasons.length, coachSeasons: coachSeasons.length, standings: standings.length, transfers: transfers.length, importSessions: importSessions.length }
  const tableCounts = Object.entries(tableRecordCounts).map(([table, records]) => ({ table, records, issues: issues.filter((row) => row.table === table).length }))
  const severityOrder = { error: 0, warning: 1, info: 2 } as const
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.title.localeCompare(b.title, 'pt-PT'))
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      issues: issues.length,
      errors: issues.filter((row) => row.severity === 'error').length,
      warnings: issues.filter((row) => row.severity === 'warning').length,
      orphanRecords: issues.filter((row) => row.code.includes('ORPHAN')).length,
      nameConflicts: issues.filter((row) => row.code.includes('NAME_CONFLICT')).length,
      missingSeasonLinks: issues.filter((row) => row.code.includes('WITHOUT_PLAYER_SEASON') || row.code.includes('WITHOUT_CLUB_SEASON')).length,
      identityConflicts: issues.filter((row) => row.code.includes('DUPLICATE')).length,
      invalidValues: issues.filter((row) => row.code.includes('INVALID')).length,
    },
    issues,
    tableCounts,
  }
}

export async function deleteRelationRecord(table: RelationTable, recordId: string): Promise<void> {
  if (table === 'playerSeasons') await db.playerSeasons.delete(recordId)
  if (table === 'playerAttributes') await db.playerAttributes.delete(recordId)
  if (table === 'playerGeneralMetrics') await db.playerGeneralMetrics.delete(recordId)
  if (table === 'playerCompetitionStats') await db.playerCompetitionStats.delete(recordId)
  if (table === 'clubSeasons') await db.clubSeasons.delete(recordId)
  if (table === 'competitionSeasons') await db.competitionSeasons.delete(recordId)
  if (table === 'coachSeasons') await db.coachSeasons.delete(recordId)
  if (table === 'standings') await db.standings.delete(recordId)
  if (table === 'transfers') await db.transfers.delete(recordId)
  if (table === 'importSessions') { const issueIds = await db.importIssues.where('importSessionId').equals(recordId).primaryKeys(); if (issueIds.length) await db.importIssues.bulkDelete(issueIds); await db.importSessions.delete(recordId) }
}

export async function syncRelationName(table: RelationTable, recordId: string): Promise<void> {
  if (table === 'playerSeasons') { const row = await db.playerSeasons.get(recordId); const club = row?.clubId ? await db.clubs.get(row.clubId) : undefined; if (row && club) await db.playerSeasons.put({ ...row, clubName: club.name }) }
  if (table === 'playerCompetitionStats') { const row = await db.playerCompetitionStats.get(recordId); if (!row) return; const [club, competition] = await Promise.all([row.clubId ? db.clubs.get(row.clubId) : undefined, db.competitions.get(row.competitionId)]); await db.playerCompetitionStats.put({ ...row, clubName: club?.name ?? row.clubName, competitionName: competition?.name ?? row.competitionName }) }
  if (table === 'coachSeasons') {
    const row = await db.coachSeasons.get(recordId)
    if (!row) return
    if (row.currentClubId?.startsWith('country:')) {
      const resolution = resolveCountry(row.currentClubName)
      if (resolution.canonical) await db.coachSeasons.put({ ...row, currentClubId: `country:${normalizeCountryToken(resolution.canonical)}`, currentClubName: resolution.canonical })
    } else {
      const club = row.currentClubId ? await db.clubs.get(row.currentClubId) : undefined
      if (club) await db.coachSeasons.put({ ...row, currentClubName: club.name })
    }
  }
  if (table === 'standings') { const row = await db.standings.get(recordId); if (!row) return; const [competition, club] = await Promise.all([db.competitions.get(row.competitionId), row.entityId && !row.entityId.startsWith('country:') ? db.clubs.get(row.entityId) : undefined]); await db.standings.put({ ...row, competitionName: competition?.name ?? row.competitionName, entityName: club?.name ?? row.entityName }) }
}

export async function createPlayerSeasonFromStats(statId: string): Promise<void> {
  const row = await db.playerCompetitionStats.get(statId)
  if (!row) return
  await db.playerSeasons.put({ id: `player-season:${row.playerId}:${row.seasonId}`, playerId: row.playerId, seasonId: row.seasonId, clubId: row.clubId, clubName: row.clubName, marketValue: row.metrics.marketValue ?? undefined, wageAnnual: row.metrics.wageAnnual ?? undefined })
}

export async function createClubSeasonFromRelation(relation: string): Promise<void> {
  const [clubId, seasonId] = relation.split('::')
  const club = await db.clubs.get(clubId)
  if (!club || !seasonId) return
  await db.clubSeasons.put({ id: `club-season:${clubId}:${seasonId}`, clubId, seasonId, reputation: club.reputation, averageAttendance: club.averageAttendance, seasonTickets: club.seasonTickets })
}

export function exportRelationDebug(snapshot: RelationDebugSnapshot): string { return JSON.stringify(snapshot, null, 2) }
