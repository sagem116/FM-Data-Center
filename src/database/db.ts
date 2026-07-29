import Dexie, { type EntityTable } from 'dexie'
import type { Club, ClubSeason, Coach, CoachSeason, Competition, CompetitionSeason, ImportIssue, ImportSession, Player, PlayerAttributes, PlayerCompetitionStats, PlayerGeneralMetrics, PlayerSeason, Season, Standing, Transfer } from '../shared/types/entities'

export class FmDatabase extends Dexie {
  seasons!: EntityTable<Season, 'id'>; players!: EntityTable<Player, 'id'>; playerSeasons!: EntityTable<PlayerSeason, 'id'>; playerAttributes!: EntityTable<PlayerAttributes, 'id'>; playerGeneralMetrics!: EntityTable<PlayerGeneralMetrics, 'id'>; playerCompetitionStats!: EntityTable<PlayerCompetitionStats, 'id'>
  clubs!: EntityTable<Club, 'id'>; clubSeasons!: EntityTable<ClubSeason, 'id'>; competitions!: EntityTable<Competition, 'id'>; competitionSeasons!: EntityTable<CompetitionSeason, 'id'>; coaches!: EntityTable<Coach, 'id'>; coachSeasons!: EntityTable<CoachSeason, 'id'>; standings!: EntityTable<Standing, 'id'>; transfers!: EntityTable<Transfer, 'id'>; importSessions!: EntityTable<ImportSession, 'id'>; importIssues!: EntityTable<ImportIssue, 'id'>
  constructor() {
    super('fm-data-center')
    this.version(1).stores({ seasons:'id, &label, startYear, endYear', players:'id, uid, name, birthDate, nationalityId', playerSeasons:'id, playerId, seasonId, clubId, [playerId+seasonId]', playerAttributes:'id, playerId, seasonId, [playerId+seasonId]', playerCompetitionStats:'id, playerId, seasonId, competitionId, clubId, [playerId+seasonId+competitionId]', clubs:'id, uid, name, countryId', competitions:'id, uid, name, countryId, continentId, type, level', coaches:'id, uid, name, nationalityId, currentClubId', transfers:'id, seasonId, playerId, fromClubId, toClubId, transferDate', importSessions:'id, seasonId, importType, status, startedAt', importIssues:'id, importSessionId, severity, code, [importSessionId+severity]' })
    this.version(2).stores({
      seasons: 'id, &label, startYear, endYear',
      players: 'id, uid, name, normalizedName, &identityKey, identityConfidence',
      playerSeasons: 'id, playerId, seasonId, clubId, &[playerId+seasonId]',
      playerAttributes: 'id, playerId, seasonId, &[playerId+seasonId]',
      playerGeneralMetrics: 'id, playerId, seasonId, &[playerId+seasonId]',
      playerCompetitionStats: 'id, playerId, seasonId, competitionId, clubId, &[playerId+seasonId+competitionId+clubId]',
      clubs: 'id, uid, name, normalizedName, country, continent',
      clubSeasons: 'id, clubId, seasonId, &[clubId+seasonId]',
      competitions: 'id, uid, name, normalizedName, type, country, continent',
      competitionSeasons: 'id, competitionId, seasonId, &[competitionId+seasonId]',
      coaches: 'id, uid, name, normalizedName, &identityKey, identityConfidence',
      coachSeasons: 'id, coachId, seasonId, currentClubId, &[coachId+seasonId]',
      standings: 'id, seasonId, competitionId, entityId, format, stage, &[seasonId+competitionId+entityName+stage]',
      transfers: 'id, seasonId, playerId, fromClubId, toClubId, transferDate',
      importSessions: 'id, seasonId, importType, status, startedAt, [seasonId+importType]',
      importIssues: 'id, importSessionId, severity, code, [importSessionId+severity]'
    })

    this.version(3).stores({
      seasons: 'id, &label, startYear, endYear',
      players: 'id, uid, name, normalizedName, &identityKey, identityConfidence',
      playerSeasons: 'id, playerId, seasonId, clubId, &[playerId+seasonId]',
      playerAttributes: 'id, playerId, seasonId, &[playerId+seasonId]',
      playerGeneralMetrics: 'id, playerId, seasonId, &[playerId+seasonId]',
      playerCompetitionStats: 'id, playerId, seasonId, competitionId, clubId, &[playerId+seasonId+competitionId+clubId]',
      clubs: 'id, uid, name, normalizedName, country, continent',
      clubSeasons: 'id, clubId, seasonId, &[clubId+seasonId]',
      competitions: 'id, uid, name, normalizedName, type, country, continent',
      competitionSeasons: 'id, competitionId, seasonId, &[competitionId+seasonId]',
      coaches: 'id, uid, name, normalizedName, &identityKey, identityConfidence',
      coachSeasons: 'id, coachId, seasonId, currentClubId, [coachId+seasonId]',
      standings: 'id, seasonId, competitionId, entityId, format, stage, &[seasonId+competitionId+entityName+stage]',
      transfers: 'id, seasonId, playerId, fromClubId, toClubId, transferDate',
      importSessions: 'id, seasonId, importType, status, startedAt, [seasonId+importType]',
      importIssues: 'id, importSessionId, severity, code, [importSessionId+severity]'
    })
  }
}
export const db = new FmDatabase()
