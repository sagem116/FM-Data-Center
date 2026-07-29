import { describe, expect, it } from 'vitest'
import { navigationItems } from '../src/app/navigation'
import {
  defaultSidebarPreferences,
  moveCategory,
  moveItem,
  normalizeSidebarPreferences,
} from '../src/app/sidebar/sidebar-config'

describe('configuração da barra lateral', () => {
  it('preserva todas as páginas exatamente uma vez', () => {
    const preferences = normalizeSidebarPreferences({
      categories: [{ id: 'principal', label: 'Principal', itemIds: ['dashboard', 'rankings', 'rankings'] }],
    })
    const itemIds = preferences.categories.flatMap((category) => category.itemIds)
    expect(new Set(itemIds).size).toBe(navigationItems.length)
    expect(itemIds).toHaveLength(navigationItems.length)
  })

  it('move páginas entre categorias e categorias entre posições', () => {
    let preferences = normalizeSidebarPreferences(defaultSidebarPreferences)
    const firstCategoryId = preferences.categories[0].id
    const secondCategoryId = preferences.categories[1].id

    preferences = moveItem(preferences, 'dashboard', secondCategoryId)
    expect(preferences.categories.find((category) => category.id === firstCategoryId)?.itemIds).not.toContain('dashboard')
    expect(preferences.categories.find((category) => category.id === secondCategoryId)?.itemIds).toContain('dashboard')

    preferences = moveCategory(preferences, firstCategoryId, secondCategoryId)
    expect(preferences.categories[1].id).toBe(firstCategoryId)
  })

  it('limita a largura, preserva nomes personalizados e mantém pelo menos ícones ou nomes visíveis', () => {
    const preferences = normalizeSidebarPreferences({
      width: 900,
      fields: { ...defaultSidebarPreferences.fields, itemIcons: false, itemLabels: false },
      itemOverrides: { dashboard: { label: 'Início', description: 'Resumo personalizado' } },
    })
    expect(preferences.width).toBe(420)
    expect(preferences.fields.itemIcons || preferences.fields.itemLabels).toBe(true)
    expect(preferences.itemOverrides.dashboard?.label).toBe('Início')
  })
})
