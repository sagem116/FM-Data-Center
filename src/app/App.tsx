import { useState, type ComponentType } from 'react'
import { navigationItems, type AppSection } from './navigation'
import { DashboardPage } from '../modules/diagnostics/pages/DashboardPage'
import { ImportsPage } from '../modules/imports/pages/ImportsPage'
import { RankingsPage } from '../modules/rankings/pages/RankingsPage'
import { ScoresPage } from '../modules/scores/pages/ScoresPage'
import { AnalysisPage } from '../modules/analysis/pages/AnalysisPage'
import { MarketPage } from '../modules/market/pages/MarketPage'
import { DiagnosticsPage } from '../modules/diagnostics/pages/DiagnosticsPage'

const pages: Record<AppSection, ComponentType> = {
  dashboard: DashboardPage,
  imports: ImportsPage,
  rankings: RankingsPage,
  scores: ScoresPage,
  analysis: AnalysisPage,
  market: MarketPage,
  diagnostics: DiagnosticsPage,
}

export function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard')
  const ActivePage = pages[activeSection]
  const activeItem = navigationItems.find((item) => item.id === activeSection)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">FM</span>
          <div>
            <strong>Data Center</strong>
            <small>Intelligence Platform</small>
          </div>
        </div>

        <nav className="navigation" aria-label="Navegação principal">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = item.id === activeSection

            return (
              <button
                key={item.id}
                type="button"
                className={isActive ? 'navigation__item is-active' : 'navigation__item'}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="sidebar__footer">
          <span>Importação real</span>
          <strong>0.4.0</strong>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">FM Data Center</span>
            <h1>{activeItem?.label}</h1>
            <p>{activeItem?.description}</p>
          </div>
          <div className="season-chip">Época: não selecionada</div>
        </header>
        <ActivePage />
      </main>
    </div>
  )
}
