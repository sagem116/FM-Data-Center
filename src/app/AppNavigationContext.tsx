import { createContext, useContext } from 'react'
import type { AppSection } from './navigation'

export type EntityKind = 'competition' | 'club' | 'player' | 'coach' | 'country'
export interface EntityTarget { kind: EntityKind; id?: string; name: string; nonce: number }
export interface AppNavigationValue {
  activeSection: AppSection
  target?: EntityTarget
  navigate: (section: AppSection, target?: Omit<EntityTarget, 'nonce'>) => void
}

const AppNavigationContext = createContext<AppNavigationValue | null>(null)
export const AppNavigationProvider = AppNavigationContext.Provider
export function useAppNavigation(): AppNavigationValue {
  const value = useContext(AppNavigationContext)
  if (!value) throw new Error('useAppNavigation must be used inside AppNavigationProvider')
  return value
}

export const profileSectionByKind: Record<EntityKind, AppSection> = {
  competition: 'competitionProfiles',
  club: 'clubProfiles',
  player: 'playerProfiles',
  coach: 'coachProfiles',
  country: 'countryProfiles',
}
