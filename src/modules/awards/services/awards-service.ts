import { db } from '../../../database/db'
import { loadMarketData } from '../../market/services/market-service'
import { computeAwards, type AwardsEngineData } from '../engine/awards-engine'
import type { AwardHistoryRow, AwardsBundle, AwardsOptions } from '../types'

let dataCache: Promise<AwardsEngineData> | null = null

async function loadData(force = false): Promise<AwardsEngineData> {
  if (force) dataCache = null
  if (dataCache) return dataCache
  dataCache = Promise.all([
    db.seasons.orderBy('startYear').toArray(),
    db.competitions.toArray(),
    db.standings.toArray(),
    db.players.toArray(),
    db.playerSeasons.toArray(),
    db.playerAttributes.toArray(),
    db.playerGeneralMetrics.toArray(),
    db.playerCompetitionStats.toArray(),
    db.clubs.toArray(),
    db.coaches.toArray(),
    db.coachSeasons.toArray(),
    loadMarketData(force),
  ]).then(([seasons, competitions, standings, players, playerSeasons, playerAttributes, playerGeneralMetrics, playerStats, clubs, coaches, coachSeasons, market]) => ({
    seasons,
    competitions,
    standings,
    players,
    playerSeasons,
    playerAttributes,
    playerGeneralMetrics,
    playerStats,
    clubs,
    coaches,
    coachSeasons,
    transfers: market.transfers,
  })).catch((error) => {
    dataCache = null
    throw error
  })
  return dataCache
}

export function clearAwardsCache(): void { dataCache = null }

export async function loadAwards(options: AwardsOptions, force = false): Promise<AwardsBundle> {
  return computeAwards(await loadData(force), options)
}

export async function loadAwardHistory(options: Omit<AwardsOptions, 'seasonId'>, awardId: string): Promise<AwardHistoryRow[]> {
  const data = await loadData()
  return data.seasons.map((season) => {
    const result = computeAwards(data, { ...options, seasonId: season.id }).awards.find((item) => item.id === awardId)
    return { seasonId: season.id, season: season.label, awardId, awardName: result?.name ?? awardId, winner: result?.winner, status: result?.status ?? 'insufficient-data' }
  }).sort((a, b) => b.season.localeCompare(a.season))
}
