import {
  Activity,
  BarChart3,
  Database,
  Gauge,
  LineChart,
  Bug,
  Building2,
  Flag,
  Network,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Trophy,
  CircleUserRound,
  Shield,
  UsersRound,
  UserCog,
  History,
  Crown,
  Lightbulb,
  ChartNoAxesCombined,
  LayoutDashboard,
  Globe2,
  FlaskConical,
  TrendingUp,
  Scale,
  GitCompare,
  Medal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppSection =
  | 'dashboard'
  | 'imports'
  | 'rankings'
  | 'rankingWeights'
  | 'challenges'
  | 'scores'
  | 'scoreWeights'
  | 'analysis'
  | 'market'
  | 'competitionProfiles'
  | 'clubProfiles'
  | 'playerProfiles'
  | 'coachProfiles'
  | 'countryProfiles'
  | 'statisticsExplorer'
  | 'statisticalIntelligence'
  | 'weightSuggestions'
  | 'coachesByCountry'
  | 'dominance'
  | 'rankingHistory'
  | 'challengesDashboard'
  | 'diagnostics'
  | 'debugScores'
  | 'debugRankings'
  | 'debugCountries'
  | 'debugClubs'
  | 'debugRelations'
  | 'tacticalLab'
  | 'developmentForecast'
  | 'competitionStrength'
  | 'universalComparator'
  | 'awards'

export interface NavigationItem {
  id: AppSection
  label: string
  description: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Visão geral da base de dados', icon: Gauge },
  { id: 'imports', label: 'Importação', description: 'Entrada e validação de dados', icon: Database },
  { id: 'rankings', label: 'Rankings', description: 'Pontos, conquistas e histórico', icon: BarChart3 },
  { id: 'rankingHistory', label: 'Evolução dos Rankings', description: 'Posições, pontos e trajetórias por época', icon: History },
  { id: 'dominance', label: 'Era de Domínio', description: 'Domínio competitivo por período e entidade', icon: Crown },
  { id: 'coachesByCountry', label: 'Escolas de Treinadores', description: 'Pontos e evolução dos treinadores por país', icon: Globe2 },
  { id: 'rankingWeights', label: 'Configuração de Pesos', description: 'Competições, posições, divisões e decaimento', icon: SlidersHorizontal },
  { id: 'weightSuggestions', label: 'Recomendador de Pesos', description: 'Sugestões calculadas por qualidade e contexto', icon: Lightbulb },
  { id: 'challenges', label: 'Desafios', description: 'Conquistas especiais que modificam os Rankings', icon: Trophy },
  { id: 'awards', label: 'Prémios', description: 'Prémios anuais de jogadores, clubes, treinadores e mercado', icon: Medal },
  { id: 'challengesDashboard', label: 'Painel de Desafios', description: 'Progresso, impacto e distribuição dos desafios', icon: LayoutDashboard },
  { id: 'scores', label: 'Scores', description: 'Atributos, métricas e inferências', icon: Activity },
  { id: 'scoreWeights', label: 'Configuração Scores', description: 'Roles, atributos, métricas e pesos', icon: SlidersHorizontal },
  { id: 'analysis', label: 'Análise', description: 'Scouting, insights e narrativa', icon: Search },
  { id: 'tacticalLab', label: 'Laboratório Tático', description: 'Formações, roles, melhor onze e equilíbrio do plantel', icon: FlaskConical },
  { id: 'developmentForecast', label: 'Previsão de Desenvolvimento', description: 'Evolução, projeção e risco dos jogadores', icon: TrendingUp },
  { id: 'competitionStrength', label: 'Índice Competitivo', description: 'Força real e comparável das competições', icon: Scale },
  { id: 'universalComparator', label: 'Comparador Universal', description: 'Comparação profunda entre entidades', icon: GitCompare },
  { id: 'statisticsExplorer', label: 'Explorador Estatístico', description: 'Estatísticas detalhadas, filtros e drill-down', icon: ChartNoAxesCombined },
  { id: 'statisticalIntelligence', label: 'Intelligence Estatística', description: 'Tendências, relações, recordes e padrões', icon: Lightbulb },
  { id: 'market', label: 'Mercado', description: 'Transferências e tendências', icon: ShoppingCart },
  { id: 'competitionProfiles', label: 'Perfis Competições', description: 'Histórico, mercado, estilo e Hall of Fame', icon: Trophy },
  { id: 'clubProfiles', label: 'Perfis Clubes', description: 'Identidade, palmarés, mercado e evolução', icon: Shield },
  { id: 'playerProfiles', label: 'Perfis Jogadores', description: 'Carreira, registos, mercado e evolução', icon: CircleUserRound },
  { id: 'coachProfiles', label: 'Perfis Treinadores', description: 'Carreira, estilo, mercado e conquistas', icon: UserCog },
  { id: 'countryProfiles', label: 'Perfis Países', description: 'Clubes, jogadores, treinadores e competições', icon: Flag },
  { id: 'diagnostics', label: 'Diagnóstico', description: 'Integridade, erros e auditoria', icon: LineChart },
  { id: 'debugScores', label: 'Debug Scores', description: 'Métricas, atributos, cobertura e conflitos', icon: Bug },
  { id: 'debugRankings', label: 'Debug Rankings', description: 'Competições, classificações e regras', icon: Bug },
  { id: 'debugCountries', label: 'Debug Países', description: 'Países, continentes e seleções nacionais', icon: Flag },
  { id: 'debugClubs', label: 'Debug Clubes', description: 'Clubes, treinadores, ligas e dados em falta', icon: Building2 },
  { id: 'debugRelations', label: 'Debug Relações', description: 'Integridade entre entidades, épocas e ficheiros', icon: Network },
]
