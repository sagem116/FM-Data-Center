import type { Season } from '../../shared/types/entities'
export function parseSeasonLabel(label: string): Season {
  const match = /^(\d{4})\/(\d{2}|\d{4})$/.exec(label.trim())
  if (!match) throw new Error('Época inválida. Usa o formato 2024/25.')
  const startYear = Number(match[1]); const endRaw = Number(match[2]); const endYear = endRaw < 100 ? Math.floor(startYear / 100) * 100 + endRaw : endRaw
  if (endYear !== startYear + 1) throw new Error('A época deve representar dois anos consecutivos.')
  return { id: `season:${startYear}-${endYear}`, label: `${startYear}/${String(endYear).slice(-2)}`, startYear, endYear, createdAt: new Date().toISOString() }
}
