import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  description?: string
  children: ReactNode
}

export function Panel({ title, description, children }: PanelProps) {
  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
      </header>
      <div className="panel__content">{children}</div>
    </section>
  )
}
