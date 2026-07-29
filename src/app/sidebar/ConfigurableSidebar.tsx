import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronDown, ChevronRight, EyeOff, Menu, PanelLeftClose, Search, Settings2 } from 'lucide-react'
import { navigationItems, type AppSection } from '../navigation'
import type { SidebarPreferences } from './sidebar-config'

interface ConfigurableSidebarProps {
  activeSection: AppSection
  preferences: SidebarPreferences
  onChange: (next: SidebarPreferences | ((current: SidebarPreferences) => SidebarPreferences)) => void
  onNavigate: (section: AppSection) => void
  onOpenSettings: () => void
}

const navigationMap = new Map(navigationItems.map((item) => [item.id, item]))

export function ConfigurableSidebar({ activeSection, preferences, onChange, onNavigate, onOpenSettings }: ConfigurableSidebarProps) {
  const [query, setQuery] = useState('')
  const compact = preferences.mode === 'compact'
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-PT')

  const categories = useMemo(() => preferences.categories
    .filter((category) => category.isVisible)
    .map((category) => ({
      ...category,
      items: category.itemIds
        .map((itemId) => navigationMap.get(itemId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .filter((item) => preferences.itemVisibility[item.id] !== false)
        .filter((item) => {
          const override = preferences.itemOverrides[item.id]
          const label = override?.label || item.label
          const description = override?.description || item.description
          return !normalizedQuery || `${label} ${description}`.toLocaleLowerCase('pt-PT').includes(normalizedQuery)
        }),
    }))
    .filter((category) => category.items.length > 0), [preferences.categories, preferences.itemVisibility, preferences.itemOverrides, normalizedQuery])

  const toggleCategory = (categoryId: string) => {
    onChange((current) => ({
      ...current,
      categories: current.categories.map((category) => {
        if (category.id === categoryId) return { ...category, isCollapsed: !category.isCollapsed }
        if (current.accordionCategories) return { ...category, isCollapsed: true }
        return category
      }),
    }))
  }

  return (
    <aside
      className={`sidebar sidebar--${preferences.mode} sidebar--density-${preferences.density}`}
      style={{ '--sidebar-expanded-width': `${preferences.width}px` } as CSSProperties}
    >
      <div className="sidebar__top-actions">
        {preferences.fields.brand ? (
          <div className="brand">
            <span className="brand__mark">FM</span>
            {!compact && preferences.fields.itemLabels ? (
              <div>
                <strong>Data Center</strong>
                {preferences.fields.brandSubtitle ? <small>Intelligence Platform</small> : null}
              </div>
            ) : null}
          </div>
        ) : <span />}
        <div>
          <button type="button" className="sidebar-tool-button" onClick={onOpenSettings} title="Personalizar barra lateral">
            <Settings2 size={17} />
          </button>
          <button
            type="button"
            className="sidebar-tool-button"
            onClick={() => onChange((current) => ({ ...current, mode: 'hidden' }))}
            title="Ocultar barra lateral"
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
      </div>

      {!compact && preferences.fields.search ? (
        <label className="sidebar-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar navegação…" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="Limpar pesquisa">×</button> : null}
        </label>
      ) : null}

      <nav className="navigation" aria-label="Navegação principal">
        {categories.map((category) => {
          const collapsed = !normalizedQuery && category.isCollapsed
          return (
            <section key={category.id} className="navigation-category">
              {!compact && preferences.fields.categoryLabels ? (
                <button type="button" className="navigation-category__header" onClick={() => toggleCategory(category.id)}>
                  <span>{category.label}</span>
                  {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
              ) : null}
              {!collapsed ? (
                <div className="navigation-category__items">
                  {category.items.map((item) => {
                    const Icon = item.icon
                    const override = preferences.itemOverrides[item.id]
                    const label = override?.label || item.label
                    const description = override?.description || item.description
                    const isActive = item.id === activeSection
                    const activeClass = isActive && preferences.fields.activeIndicator ? ' is-active' : ''
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`navigation__item${activeClass}`}
                        onClick={() => onNavigate(item.id)}
                        title={compact || !preferences.fields.itemLabels ? `${label} — ${description}` : description}
                      >
                        {preferences.fields.itemIcons ? <Icon size={18} /> : null}
                        {!compact && preferences.fields.itemLabels ? (
                          <span>
                            <strong>{label}</strong>
                            {preferences.fields.itemDescriptions ? <small>{description}</small> : null}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </section>
          )
        })}
        {!categories.length ? (
          <div className="sidebar-no-results">
            <EyeOff size={18} />
            {!compact ? <span>Nenhuma página visível.</span> : null}
          </div>
        ) : null}
      </nav>

      {preferences.fields.footer ? (
        <div className="sidebar__footer">
          {!compact ? <span>Rankings + Intelligence</span> : <Menu size={16} />}
          {!compact ? <strong>0.15.0</strong> : null}
        </div>
      ) : null}
    </aside>
  )
}
