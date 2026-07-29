import { useCallback, useMemo, useState, type ComponentType, type CSSProperties } from 'react'
import { Menu, Settings2 } from 'lucide-react'
import { navigationItems, type AppSection } from './navigation'
import { AppNavigationProvider, type EntityTarget } from './AppNavigationContext'
import { GlobalSearch } from './GlobalSearch'
import { ConfigurableSidebar } from './sidebar/ConfigurableSidebar'
import { SidebarCustomizer } from './sidebar/SidebarCustomizer'
import { useSidebarPreferences } from './sidebar/useSidebarPreferences'
import { DashboardPage } from '../modules/diagnostics/pages/DashboardPage'
import { ImportsPage } from '../modules/imports/pages/ImportsPage'
import { RankingsPage } from '../modules/rankings/pages/RankingsPage'
import { RankingWeightsPage } from '../modules/rankings/pages/RankingWeightsPage'
import { ChallengesPage } from '../modules/challenges/ChallengesPage'
import { ChallengesDashboardPage } from '../modules/challenges/ChallengesDashboardPage'
import { ScoresPage } from '../modules/scores/pages/ScoresPage'
import { ScoreWeightsPage } from '../modules/scores/pages/ScoreWeightsPage'
import { AnalysisPage } from '../modules/analysis/pages/AnalysisPage'
import { StatisticsExplorerPage } from '../modules/analytics/pages/StatisticsExplorerPage'
import { StatisticalIntelligencePage } from '../modules/analytics/pages/StatisticalIntelligencePage'
import { WeightSuggestionsPage } from '../modules/analytics/pages/WeightSuggestionsPage'
import { CoachesByCountryPage } from '../modules/analytics/pages/CoachesByCountryPage'
import { DominancePage } from '../modules/analytics/pages/DominancePage'
import { RankingHistoryPage } from '../modules/analytics/pages/RankingHistoryPage'
import { MarketPage } from '../modules/market/pages/MarketPage'
import { CompetitionProfilePage } from '../modules/profiles/pages/CompetitionProfilePage'
import { ClubProfilePage } from '../modules/profiles/pages/ClubProfilePage'
import { PlayerProfilePage } from '../modules/profiles/pages/PlayerProfilePage'
import { CoachProfilePage } from '../modules/profiles/pages/CoachProfilePage'
import { CountryProfilePage } from '../modules/profiles/pages/CountryProfilePage'
import { DiagnosticsPage } from '../modules/diagnostics/pages/DiagnosticsPage'
import { DebugScoresPage } from '../modules/diagnostics/pages/DebugScoresPage'
import { DebugRankingsPage } from '../modules/diagnostics/pages/DebugRankingsPage'
import { DebugCountriesPage } from '../modules/diagnostics/pages/DebugCountriesPage'
import { DebugClubsPage } from '../modules/diagnostics/pages/DebugClubsPage'
import { DebugRelationsPage } from '../modules/diagnostics/pages/DebugRelationsPage'
import { TacticalLabPage } from '../modules/intelligence/pages/TacticalLabPage'
import { DevelopmentForecastPage } from '../modules/intelligence/pages/DevelopmentForecastPage'
import { CompetitionStrengthPage } from '../modules/intelligence/pages/CompetitionStrengthPage'
import { UniversalComparatorPage } from '../modules/intelligence/pages/UniversalComparatorPage'
import { AwardsPage } from '../modules/awards/pages/AwardsPage'

const pages: Record<AppSection, ComponentType> = {
  dashboard: DashboardPage,
  imports: ImportsPage,
  rankings: RankingsPage,
  rankingHistory: RankingHistoryPage,
  dominance: DominancePage,
  coachesByCountry: CoachesByCountryPage,
  rankingWeights: RankingWeightsPage,
  weightSuggestions: WeightSuggestionsPage,
  challenges: ChallengesPage,
  challengesDashboard: ChallengesDashboardPage,
  scores: ScoresPage,
  scoreWeights: ScoreWeightsPage,
  analysis: AnalysisPage,
  statisticsExplorer: StatisticsExplorerPage,
  statisticalIntelligence: StatisticalIntelligencePage,
  market: MarketPage,
  competitionProfiles: CompetitionProfilePage,
  clubProfiles: ClubProfilePage,
  playerProfiles: PlayerProfilePage,
  coachProfiles: CoachProfilePage,
  countryProfiles: CountryProfilePage,
  diagnostics: DiagnosticsPage,
  debugScores: DebugScoresPage,
  debugRankings: DebugRankingsPage,
  debugCountries: DebugCountriesPage,
  debugClubs: DebugClubsPage,
  debugRelations: DebugRelationsPage,
  tacticalLab: TacticalLabPage,
  developmentForecast: DevelopmentForecastPage,
  competitionStrength: CompetitionStrengthPage,
  universalComparator: UniversalComparatorPage,
  awards: AwardsPage,
}

export function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('dashboard')
  const [target, setTarget] = useState<EntityTarget>()
  const [isSidebarEditorOpen, setSidebarEditorOpen] = useState(false)
  const { preferences: sidebarPreferences, setPreferences: setSidebarPreferences, resetPreferences: resetSidebarPreferences } = useSidebarPreferences()
  const ActivePage = pages[activeSection]
  const activeItem = navigationItems.find((item) => item.id === activeSection)
  const navigate = useCallback((section: AppSection, nextTarget?: Omit<EntityTarget, 'nonce'>) => {
    setActiveSection(section)
    setTarget(nextTarget ? { ...nextTarget, nonce: Date.now() } : undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  const navigationValue = useMemo(() => ({ activeSection, target, navigate }), [activeSection, target, navigate])
  const appShellStyle = {
    '--app-sidebar-width': sidebarPreferences.mode === 'expanded' ? `${sidebarPreferences.width}px` : sidebarPreferences.mode === 'compact' ? '82px' : '0px',
  } as CSSProperties

  return (
    <AppNavigationProvider value={navigationValue}>
      <div className={`app-shell app-shell--sidebar-${sidebarPreferences.mode}`} style={appShellStyle}>
        {sidebarPreferences.mode !== 'hidden' ? (
          <ConfigurableSidebar
            activeSection={activeSection}
            preferences={sidebarPreferences}
            onChange={setSidebarPreferences}
            onNavigate={(section) => navigate(section)}
            onOpenSettings={() => setSidebarEditorOpen(true)}
          />
        ) : null}

        <main className="main-content">
          <header className="topbar topbar--with-search">
            <div className="topbar__left">
              <div className="topbar__navigation-tools">
                {sidebarPreferences.mode === 'hidden' ? (
                  <button
                    type="button"
                    className="topbar-navigation-button"
                    onClick={() => setSidebarPreferences((current) => ({ ...current, mode: 'expanded' }))}
                    title="Mostrar barra lateral"
                  >
                    <Menu size={19} />
                    <span>Menu</span>
                  </button>
                ) : null}
                <button
                  type="button"
                  className="topbar-navigation-button topbar-navigation-button--settings"
                  onClick={() => setSidebarEditorOpen(true)}
                  title="Personalizar barra lateral"
                >
                  <Settings2 size={18} />
                </button>
              </div>
              <div className="topbar__identity">
                <span className="eyebrow">FM Data Center</span>
                <h1>{activeItem?.label}</h1>
                <p>{activeItem?.description}</p>
              </div>
            </div>
            <GlobalSearch />
            <div className="season-chip">Neon Intelligence</div>
          </header>
          <ActivePage />
        </main>
      </div>

      {isSidebarEditorOpen ? (
        <SidebarCustomizer
          preferences={sidebarPreferences}
          onChange={setSidebarPreferences}
          onReset={resetSidebarPreferences}
          onClose={() => setSidebarEditorOpen(false)}
        />
      ) : null}
    </AppNavigationProvider>
  )
}
