import { db } from '../../../database/db'
import { computeRankings } from '../engine/ranking-engine'
import type { RankingConfig, RankingEntity, RankingMode, RankingModule } from '../config/default-ranking-config'
import type { Challenge } from '../../challenges/challenges'

const avg = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const groupBy = <T>(items: T[], key: (item: T) => string) => {
  const result = new Map<string, T[]>()
  for (const item of items) {
    const id = key(item)
    const group = result.get(id) ?? []
    group.push(item)
    result.set(id, group)
  }
  return result
}

export interface LoadRankingsOptions {
  config: RankingConfig
  entity: RankingEntity
  module: RankingModule
  withDecay: boolean
  mode: RankingMode
  seasonId?: string
  seasonFromId?: string
  seasonToId?: string
  competitionId?: string
  challenges: Challenge[]
}

export async function loadRankings(options: LoadRankingsOptions) {
  const [standings, competitions, seasons, clubs, coaches, coachSeasons, players, playerStats, playerSeasons, clubSeasons] = await Promise.all([
    db.standings.toArray(),
    db.competitions.toArray(),
    db.seasons.toArray(),
    db.clubs.toArray(),
    db.coaches.toArray(),
    db.coachSeasons.toArray(),
    db.players.toArray(),
    db.playerCompetitionStats.toArray(),
    db.playerSeasons.toArray(),
    db.clubSeasons.toArray(),
  ])
  const seasonMap = new Map(seasons.map((season) => [season.id, season]))
  const from = options.seasonFromId ? seasonMap.get(options.seasonFromId)?.startYear : undefined
  const to = options.seasonToId ? seasonMap.get(options.seasonToId)?.endYear : undefined
  const inRange = (seasonId: string) => {
    const season = seasonMap.get(seasonId)
    if (options.seasonId && seasonId !== options.seasonId) return false
    if (from && season && season.startYear < from) return false
    if (to && season && season.endYear > to) return false
    return true
  }

  const result = computeRankings({
    data: { standings, competitions, seasons, clubs, coaches, coachSeasons, players, playerStats },
    ...options,
  })
  const clubMap = new Map(clubs.map((club) => [club.id, club]))
  const playerMap = new Map(players.map((player) => [player.id, player]))
  const competitionMap = new Map(competitions.map((competition) => [competition.id, competition]))
  const statsByPlayer = groupBy(playerStats.filter((stat) => inRange(stat.seasonId)), (stat) => stat.playerId)
  const statsByClub = groupBy(playerStats.filter((stat) => inRange(stat.seasonId)), (stat) => stat.clubId ?? 'no-club')
  const statsByCompetition = groupBy(playerStats.filter((stat) => inRange(stat.seasonId)), (stat) => stat.competitionId)
  const seasonsByPlayer = groupBy(playerSeasons.filter((season) => inRange(season.seasonId)), (season) => season.playerId)
  const playerSeasonMap = new Map(playerSeasons.map((season) => [`${season.playerId}|${season.seasonId}`, season]))
  const clubSeasonMap = new Map(clubSeasons.map((season) => [`${season.clubId}|${season.seasonId}`, season]))

  for (const entry of result.entries) {
    if (options.entity === 'players') {
      const stats = statsByPlayer.get(entry.entityId ?? '') ?? []
      const playerSeasonRows = seasonsByPlayer.get(entry.entityId ?? '') ?? []
      const latest = [...playerSeasonRows].sort((a, b) => b.seasonId.localeCompare(a.seasonId))[0]
      const club = latest?.clubId ? clubMap.get(latest.clubId) : undefined
      entry.meta = {
        club: latest?.clubName,
        position: latest?.position,
        age: latest?.age,
        nationality: playerMap.get(entry.entityId ?? '')?.nationality,
        continent: club?.continent,
        appearances: stats.reduce((sum, stat) => sum + stat.appearances, 0),
        minutes: stats.reduce((sum, stat) => sum + stat.minutes, 0),
        goals: stats.reduce((sum, stat) => sum + stat.goals, 0),
        assists: stats.reduce((sum, stat) => sum + stat.assists, 0),
        xg: stats.reduce((sum, stat) => sum + (stat.metrics.xg ?? 0), 0),
        rating: avg(stats.map((stat) => stat.metrics.averageRating ?? 0).filter(Boolean)),
        ca: avg(stats.map((stat) => stat.metrics.currentAbility ?? 0).filter(Boolean)),
        pa: avg(stats.map((stat) => stat.metrics.potentialAbility ?? 0).filter(Boolean)),
      }
    }

    if (options.entity === 'clubs') {
      const stats = statsByClub.get(entry.entityId ?? '') ?? []
      const playerIds = [...new Set(stats.map((stat) => stat.playerId))]
      const playerSeasonRows = playerIds.flatMap((playerId) => seasonsByPlayer.get(playerId) ?? [])
      const club = clubMap.get(entry.entityId ?? '')
      entry.meta = {
        country: club?.country,
        continent: club?.continent,
        players: playerIds.length,
        appearances: stats.reduce((sum, stat) => sum + stat.appearances, 0),
        goals: stats.reduce((sum, stat) => sum + stat.goals, 0),
        assists: stats.reduce((sum, stat) => sum + stat.assists, 0),
        averageAge: avg(playerSeasonRows.map((row) => row.age ?? 0).filter(Boolean)),
        totalValue: playerSeasonRows.reduce((sum, row) => sum + (row.marketValue ?? 0), 0),
        averageRating: avg(stats.map((stat) => stat.metrics.averageRating ?? 0).filter(Boolean)),
      }
    }

    if (options.entity === 'competitions') {
      const stats = statsByCompetition.get(entry.entityId ?? '') ?? []
      const competition = competitionMap.get(entry.entityId ?? '')
      const playerSeasonKeys = [...new Set(stats.map((stat) => `${stat.playerId}|${stat.seasonId}`))]
      const marketValues = playerSeasonKeys.map((key) => playerSeasonMap.get(key)?.marketValue).filter((value): value is number => typeof value === 'number')
      const wages = playerSeasonKeys.map((key) => playerSeasonMap.get(key)?.wageAnnual).filter((value): value is number => typeof value === 'number')
      const fallbackMarketValues = stats.map((stat) => stat.metrics.marketValue).filter((value): value is number => typeof value === 'number')
      const fallbackWages = stats.map((stat) => stat.metrics.wageAnnual).filter((value): value is number => typeof value === 'number')
      const clubSeasonKeys = [...new Set(stats.filter((stat) => stat.clubId).map((stat) => `${stat.clubId}|${stat.seasonId}`))]
      const clubReputations = clubSeasonKeys
        .map((key) => {
          const [clubId] = key.split('|')
          return clubSeasonMap.get(key)?.reputation ?? clubMap.get(clubId)?.reputation
        })
        .filter((value): value is number => typeof value === 'number')
      entry.meta = {
        type: competition?.type,
        reputation: competition?.reputation,
        country: competition?.country,
        continent: competition?.continent,
        clubs: new Set(stats.map((stat) => stat.clubId).filter(Boolean)).size,
        players: new Set(stats.map((stat) => stat.playerId)).size,
        appearances: stats.reduce((sum, stat) => sum + stat.appearances, 0),
        goals: stats.reduce((sum, stat) => sum + stat.goals, 0),
        assists: stats.reduce((sum, stat) => sum + stat.assists, 0),
        averageRating: avg(stats.map((stat) => stat.metrics.averageRating ?? 0).filter(Boolean)),
        ca: avg(stats.map((stat) => stat.metrics.currentAbility ?? 0).filter(Boolean)),
        pa: avg(stats.map((stat) => stat.metrics.potentialAbility ?? 0).filter(Boolean)),
        averageMarketValue: avg(marketValues.length ? marketValues : fallbackMarketValues),
        averageWage: avg(wages.length ? wages : fallbackWages),
        averageClubReputation: avg(clubReputations),
      }
    }

    if (options.entity === 'coaches') {
      const coachRows = coachSeasons.filter((row) => row.coachId === entry.entityId && inRange(row.seasonId))
      const latest = coachRows.at(-1)
      const club = latest?.currentClubId ? clubMap.get(latest.currentClubId) : undefined
      entry.meta = {
        club: latest?.currentClubName,
        country: club?.country,
        continent: club?.continent,
        winRate: avg(coachRows.map((row) => row.winRate ?? 0).filter(Boolean)),
        titles: coachRows.reduce((sum, row) => sum + (row.titles ?? 0), 0),
      }
    }

    if (options.entity === 'countries') {
      const relatedClubs = clubs.filter((club) => club.country === entry.name)
      entry.meta = { continent: relatedClubs.find((club) => club.continent)?.continent }
    }
  }

  return {
    result,
    seasons: seasons.sort((a, b) => b.endYear - a.endYear),
    competitions: competitions.sort((a, b) => a.name.localeCompare(b.name)),
  }
}
