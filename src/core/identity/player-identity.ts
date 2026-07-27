import type { IdentityConfidence, Player } from '../../shared/types/entities'
import { normalizeKey, normalizeText } from '../../modules/imports/core/normalizers'

export interface PlayerIdentityInput { uid?: unknown; name?: unknown; birthDate?: unknown; club?: unknown; age?: unknown }
export interface ResolvedIdentity { key: string; uid?: string; normalizedName: string; confidence: IdentityConfidence; strategy: 'uid' | 'name-birthdate' | 'name-club-age' }

export function resolvePlayerIdentity(input: PlayerIdentityInput): ResolvedIdentity {
  const uid = normalizeText(input.uid)
  const name = normalizeText(input.name) ?? 'jogador-desconhecido'
  const normalizedName = normalizeKey(name)
  const birthDate = normalizeText(input.birthDate)
  const club = normalizeText(input.club)
  const age = typeof input.age === 'number' ? String(input.age) : normalizeText(input.age)
  if (uid) return { key: `uid:${uid}`, uid, normalizedName, confidence: 'high', strategy: 'uid' }
  if (birthDate) return { key: `name-birth:${normalizedName}:${birthDate}`, normalizedName, confidence: 'medium', strategy: 'name-birthdate' }
  return { key: `fallback:${normalizedName}:${normalizeKey(club ?? 'sem-clube')}:${age ?? 'sem-idade'}`, normalizedName, confidence: 'low', strategy: 'name-club-age' }
}

export function groupByPlayerIdentity<T extends PlayerIdentityInput>(rows: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const key = resolvePlayerIdentity(row).key
    groups.set(key, [...(groups.get(key) ?? []), row])
  }
  return groups
}

export function playerMatchesIdentity(player: Player, resolved: ResolvedIdentity): boolean {
  return player.identityKey === resolved.key || Boolean(resolved.uid && player.uid === resolved.uid)
}
