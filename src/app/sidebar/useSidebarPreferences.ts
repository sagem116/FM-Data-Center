import { useCallback, useEffect, useState } from 'react'
import {
  defaultSidebarPreferences,
  loadSidebarPreferences,
  normalizeSidebarPreferences,
  saveSidebarPreferences,
  type SidebarPreferences,
} from './sidebar-config'

export function useSidebarPreferences() {
  const [preferences, setPreferencesState] = useState<SidebarPreferences>(() => loadSidebarPreferences())

  const setPreferences = useCallback((next: SidebarPreferences | ((current: SidebarPreferences) => SidebarPreferences)) => {
    setPreferencesState((current) => typeof next === 'function' ? next(current) : next)
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferencesState(normalizeSidebarPreferences(defaultSidebarPreferences))
  }, [])

  useEffect(() => {
    saveSidebarPreferences(preferences)
  }, [preferences])

  return { preferences, setPreferences, resetPreferences }
}
