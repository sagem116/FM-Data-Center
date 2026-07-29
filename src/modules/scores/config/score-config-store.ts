import { cloneScoreConfig, DEFAULT_SCORE_CONFIG } from './default-score-config'
import type { ScoreConfig } from './types'

const KEY = 'fm-data-center-score-config-v1'

function mergeDefaultDimensions(parsed: ScoreConfig['inferenceDimensions'] | undefined): ScoreConfig['inferenceDimensions'] {
  const existing = parsed ?? []
  const ids = new Set(existing.map((item) => item.id))
  return [...existing, ...DEFAULT_SCORE_CONFIG.inferenceDimensions.filter((item) => !ids.has(item.id)).map((item) => structuredClone(item))]
}

export function loadScoreConfig(): ScoreConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return cloneScoreConfig()
    const parsed = JSON.parse(raw) as Partial<ScoreConfig>
    return {
      ...cloneScoreConfig(DEFAULT_SCORE_CONFIG),
      ...parsed,
      version: DEFAULT_SCORE_CONFIG.version,
      roles: parsed.roles ?? cloneScoreConfig(DEFAULT_SCORE_CONFIG).roles,
      inferenceDimensions: mergeDefaultDimensions(parsed.inferenceDimensions),
    }
  } catch {
    return cloneScoreConfig()
  }
}

export function saveScoreConfig(config: ScoreConfig): void {
  localStorage.setItem(KEY, JSON.stringify(config))
  window.dispatchEvent(new Event('fm-score-config-changed'))
}

export function resetScoreConfig(): ScoreConfig {
  const config = cloneScoreConfig()
  saveScoreConfig(config)
  return config
}
