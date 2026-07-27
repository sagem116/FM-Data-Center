import { Panel } from '../../../shared/components/Panel'
import { StatCard } from '../../../shared/components/StatCard'

export function DashboardPage() {
  return (
    <div className="page-stack">
      <div className="stats-grid">
        <StatCard label="Jogadores" value="0" detail="Nenhuma importação concluída" />
        <StatCard label="Clubes" value="0" detail="Base de dados vazia" />
        <StatCard label="Competições" value="0" detail="Aguardam importação" />
        <StatCard label="Problemas" value="0" detail="Sem diagnósticos registados" />
      </div>

      <Panel title="Estado da plataforma" description="A fundação técnica está instalada e pronta para receber o primeiro importador.">
        <div className="status-list">
          <div><span className="status-dot is-ready" />Base de dados IndexedDB configurada</div>
          <div><span className="status-dot is-ready" />Modelo de entidades criado</div>
          <div><span className="status-dot is-ready" />Validações Zod configuradas</div>
          <div><span className="status-dot" />Importadores ainda não implementados</div>
        </div>
      </Panel>
    </div>
  )
}
