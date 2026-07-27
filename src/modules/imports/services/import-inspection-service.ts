import { db } from '../../../database/db'
import type { ImportKind } from '../core/types'

export interface ImportBlockSnapshot {
  kind: ImportKind
  seasonId: string
  records: number
  previousRecords: number
  difference: number
}

async function countBlock(kind: ImportKind, seasonId: string): Promise<number> {
  if (kind === 'players') return db.playerSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'statistics') return db.playerCompetitionStats.where('seasonId').equals(seasonId).count()
  if (kind === 'coaches') return db.coachSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'clubs') return db.clubSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'competitions') return db.competitionSeasons.where('seasonId').equals(seasonId).count()
  if (kind === 'standings') return db.standings.where('seasonId').equals(seasonId).count()
  return db.transfers.where('seasonId').equals(seasonId).count()
}

export async function inspectBlockBeforeImport(kind: ImportKind, seasonId: string): Promise<number> {
  return countBlock(kind, seasonId)
}

export async function inspectBlockAfterImport(kind: ImportKind, seasonId: string, previousRecords: number): Promise<ImportBlockSnapshot> {
  const records = await countBlock(kind, seasonId)
  return { kind, seasonId, records, previousRecords, difference: records - previousRecords }
}

export interface DataInspectionSnapshot {
  seasons: Array<{ id: string; label: string }>
  recentPlayers: Array<{ id: string; uid?: string; name: string; confidence: string }>
  recentClubs: Array<{ id: string; name: string; country?: string; continent?: string }>
  recentCompetitions: Array<{ id: string; name: string; type: string; reputation?: number }>
  recentSessions: Array<{ id: string; fileName: string; importType: string; status: string; created: number; updated: number; skipped: number; warnings: number; errors: number; completedAt?: string }>
}

export async function inspectImportedData(): Promise<DataInspectionSnapshot> {
  const [seasons, players, clubs, competitions, sessions] = await Promise.all([
    db.seasons.orderBy('startYear').reverse().toArray(),
    db.players.orderBy('updatedAt').reverse().limit(20).toArray(),
    db.clubs.limit(20).toArray(),
    db.competitions.limit(20).toArray(),
    db.importSessions.orderBy('startedAt').reverse().limit(15).toArray(),
  ])
  return {
    seasons: seasons.map(({ id, label }) => ({ id, label })),
    recentPlayers: players.map(({ id, uid, name, identityConfidence }) => ({ id, uid, name, confidence: identityConfidence })),
    recentClubs: clubs.map(({ id, name, country, continent }) => ({ id, name, country, continent })),
    recentCompetitions: competitions.map(({ id, name, type, reputation }) => ({ id, name, type, reputation })),
    recentSessions: sessions.map((session) => ({
      id: session.id,
      fileName: session.fileName,
      importType: session.importType,
      status: session.status,
      created: session.createdCount,
      updated: session.updatedCount,
      skipped: session.skippedCount,
      warnings: session.warningCount,
      errors: session.errorCount,
      completedAt: session.completedAt,
    })),
  }
}
