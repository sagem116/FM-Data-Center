import type { MouseEvent, ReactNode } from 'react'
import { profileSectionByKind, type EntityKind, useAppNavigation } from '../../app/AppNavigationContext'

export function EntityLink({ kind, id, name, children, className = '' }: { kind: EntityKind; id?: string; name: string; children?: ReactNode; className?: string }) {
  const { navigate } = useAppNavigation()
  const open = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    navigate(profileSectionByKind[kind], { kind, id, name })
  }
  return <button type="button" className={`entity-link ${className}`.trim()} onClick={open} title={`Abrir perfil: ${name}`}>{children ?? name}</button>
}
