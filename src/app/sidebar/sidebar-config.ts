import type { AppSection } from '../navigation'
import { navigationItems } from '../navigation'

export type SidebarMode = 'expanded' | 'compact' | 'hidden'
export type SidebarDensity = 'comfortable' | 'compact'

export interface SidebarCategory {
  id: string
  label: string
  itemIds: AppSection[]
  isVisible: boolean
  isCollapsed: boolean
}

export interface SidebarItemOverride {
  label?: string
  description?: string
}

export interface SidebarFieldVisibility {
  brand: boolean
  brandSubtitle: boolean
  search: boolean
  categoryLabels: boolean
  itemIcons: boolean
  itemLabels: boolean
  itemDescriptions: boolean
  footer: boolean
  activeIndicator: boolean
}

export interface SidebarPreferences {
  version: 1
  mode: SidebarMode
  density: SidebarDensity
  width: number
  accordionCategories: boolean
  categories: SidebarCategory[]
  itemVisibility: Partial<Record<AppSection, boolean>>
  itemOverrides: Partial<Record<AppSection, SidebarItemOverride>>
  fields: SidebarFieldVisibility
}

export const SIDEBAR_STORAGE_KEY = 'fm-data-center:sidebar-preferences:v1'

const defaultCategories: SidebarCategory[] = [
  {
    id: 'principal',
    label: 'Principal',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['dashboard', 'imports'],
  },
  {
    id: 'rankings-historia',
    label: 'Rankings e História',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['rankings', 'rankingHistory', 'dominance', 'coachesByCountry', 'rankingWeights', 'weightSuggestions'],
  },
  {
    id: 'scores-estatistica',
    label: 'Scores e Estatística',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['scores', 'scoreWeights', 'statisticsExplorer', 'statisticalIntelligence', 'analysis'],
  },
  {
    id: 'intelligence',
    label: 'Decision Intelligence',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['tacticalLab', 'developmentForecast', 'competitionStrength', 'universalComparator'],
  },
  {
    id: 'mercado-premios',
    label: 'Mercado e Prémios',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['market', 'awards'],
  },
  {
    id: 'desafios',
    label: 'Desafios',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['challenges', 'challengesDashboard'],
  },
  {
    id: 'perfis',
    label: 'Perfis',
    isVisible: true,
    isCollapsed: false,
    itemIds: ['competitionProfiles', 'clubProfiles', 'playerProfiles', 'coachProfiles', 'countryProfiles'],
  },
  {
    id: 'debug',
    label: 'Debug e Integridade',
    isVisible: true,
    isCollapsed: true,
    itemIds: ['diagnostics', 'debugScores', 'debugRankings', 'debugCountries', 'debugClubs', 'debugRelations'],
  },
]

export const defaultSidebarPreferences: SidebarPreferences = {
  version: 1,
  mode: 'expanded',
  density: 'comfortable',
  width: 286,
  accordionCategories: false,
  categories: defaultCategories,
  itemVisibility: Object.fromEntries(navigationItems.map((item) => [item.id, true])) as Partial<Record<AppSection, boolean>>,
  itemOverrides: {},
  fields: {
    brand: true,
    brandSubtitle: true,
    search: true,
    categoryLabels: true,
    itemIcons: true,
    itemLabels: true,
    itemDescriptions: false,
    footer: true,
    activeIndicator: true,
  },
}

const cloneDefaults = (): SidebarPreferences => JSON.parse(JSON.stringify(defaultSidebarPreferences)) as SidebarPreferences

const isAppSection = (value: unknown): value is AppSection =>
  typeof value === 'string' && navigationItems.some((item) => item.id === value)

const uniqueId = (preferred: unknown, used: Set<string>, index: number) => {
  const base = typeof preferred === 'string' && preferred.trim() ? preferred.trim() : `categoria-${index + 1}`
  let id = base
  let suffix = 2
  while (used.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  used.add(id)
  return id
}

export function normalizeSidebarPreferences(input: unknown): SidebarPreferences {
  const defaults = cloneDefaults()
  if (!input || typeof input !== 'object') return defaults

  const raw = input as Partial<SidebarPreferences>
  const usedCategoryIds = new Set<string>()
  const assignedItems = new Set<AppSection>()
  const categories: SidebarCategory[] = []

  if (Array.isArray(raw.categories)) {
    raw.categories.forEach((category, index) => {
      if (!category || typeof category !== 'object') return
      const source = category as Partial<SidebarCategory>
      const itemIds = Array.isArray(source.itemIds)
        ? source.itemIds.filter(isAppSection).filter((itemId) => {
            if (assignedItems.has(itemId)) return false
            assignedItems.add(itemId)
            return true
          })
        : []

      categories.push({
        id: uniqueId(source.id, usedCategoryIds, index),
        label: typeof source.label === 'string' && source.label.trim() ? source.label.trim() : `Categoria ${index + 1}`,
        itemIds,
        isVisible: source.isVisible !== false,
        isCollapsed: source.isCollapsed === true,
      })
    })
  }

  if (!categories.length) {
    defaults.categories.forEach((category) => {
      categories.push({ ...category, itemIds: [...category.itemIds] })
      category.itemIds.forEach((itemId) => assignedItems.add(itemId))
    })
  }

  const missingItems = navigationItems.map((item) => item.id).filter((itemId) => !assignedItems.has(itemId))
  if (missingItems.length) {
    const fallback = categories.find((category) => category.id === 'outros') ?? {
      id: uniqueId('outros', usedCategoryIds, categories.length),
      label: 'Outros',
      itemIds: [],
      isVisible: true,
      isCollapsed: false,
    }
    if (!categories.includes(fallback)) categories.push(fallback)
    fallback.itemIds.push(...missingItems)
  }

  const width = Number(raw.width)
  const requestedMode = raw.mode
  const mode: SidebarMode = requestedMode === 'compact' || requestedMode === 'hidden' ? requestedMode : 'expanded'
  const requestedDensity = raw.density
  const density: SidebarDensity = requestedDensity === 'compact' ? 'compact' : 'comfortable'

  const itemVisibility: Partial<Record<AppSection, boolean>> = {}
  const itemOverrides: Partial<Record<AppSection, SidebarItemOverride>> = {}
  navigationItems.forEach((item) => {
    itemVisibility[item.id] = raw.itemVisibility?.[item.id] !== false
    const override = raw.itemOverrides?.[item.id]
    if (override && typeof override === 'object') {
      const label = typeof override.label === 'string' && override.label.trim() ? override.label.trim() : undefined
      const description = typeof override.description === 'string' && override.description.trim() ? override.description.trim() : undefined
      if (label || description) itemOverrides[item.id] = { label, description }
    }
  })

  const fields = { ...defaults.fields, ...(raw.fields ?? {}) }
  if (!fields.itemIcons && !fields.itemLabels) fields.itemLabels = true

  return {
    version: 1,
    mode,
    density,
    width: Number.isFinite(width) ? Math.min(420, Math.max(220, width)) : defaults.width,
    accordionCategories: raw.accordionCategories === true,
    categories,
    itemVisibility,
    itemOverrides,
    fields,
  }
}

export function loadSidebarPreferences(): SidebarPreferences {
  if (typeof window === 'undefined') return cloneDefaults()
  try {
    const raw = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    return raw ? normalizeSidebarPreferences(JSON.parse(raw)) : cloneDefaults()
  } catch {
    return cloneDefaults()
  }
}

export function saveSidebarPreferences(preferences: SidebarPreferences) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(normalizeSidebarPreferences(preferences)))
}

export function createSidebarCategory(label = 'Nova categoria'): SidebarCategory {
  return {
    id: `categoria-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    itemIds: [],
    isVisible: true,
    isCollapsed: false,
  }
}

export function moveCategory(preferences: SidebarPreferences, sourceId: string, targetId: string): SidebarPreferences {
  if (sourceId === targetId) return preferences
  const categories = preferences.categories.map((category) => ({ ...category, itemIds: [...category.itemIds] }))
  const sourceIndex = categories.findIndex((category) => category.id === sourceId)
  const targetIndex = categories.findIndex((category) => category.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return preferences
  const [source] = categories.splice(sourceIndex, 1)
  categories.splice(targetIndex, 0, source)
  return { ...preferences, categories }
}

export function moveItem(
  preferences: SidebarPreferences,
  itemId: AppSection,
  targetCategoryId: string,
  beforeItemId?: AppSection,
): SidebarPreferences {
  const categories = preferences.categories.map((category) => ({ ...category, itemIds: [...category.itemIds] }))
  categories.forEach((category) => {
    category.itemIds = category.itemIds.filter((existingId) => existingId !== itemId)
  })
  const target = categories.find((category) => category.id === targetCategoryId)
  if (!target) return preferences
  const targetIndex = beforeItemId ? target.itemIds.indexOf(beforeItemId) : -1
  if (targetIndex >= 0) target.itemIds.splice(targetIndex, 0, itemId)
  else target.itemIds.push(itemId)
  return { ...preferences, categories }
}
