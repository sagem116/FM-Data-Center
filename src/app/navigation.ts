import {
  Activity,
  BarChart3,
  Database,
  Gauge,
  LineChart,
  Search,
  ShoppingCart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AppSection =
  | 'dashboard'
  | 'imports'
  | 'rankings'
  | 'scores'
  | 'analysis'
  | 'market'
  | 'diagnostics'

export interface NavigationItem {
  id: AppSection
  label: string
  description: string
  icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Visão geral da base de dados', icon: Gauge },
  { id: 'imports', label: 'Importação', description: 'Entrada e validação de dados', icon: Database },
  { id: 'rankings', label: 'Rankings', description: 'Pontos, pesos e histórico', icon: BarChart3 },
  { id: 'scores', label: 'Scores', description: 'Atributos, métricas e funções', icon: Activity },
  { id: 'analysis', label: 'Análise', description: 'Scouting, insights e narrativa', icon: Search },
  { id: 'market', label: 'Mercado', description: 'Transferências e tendências', icon: ShoppingCart },
  { id: 'diagnostics', label: 'Diagnóstico', description: 'Integridade, erros e auditoria', icon: LineChart },
]
