import { useMemo, useRef, useState, type DragEvent } from 'react'
import {
  Download,
  Eye,
  EyeOff,
  GripVertical,
  LayoutPanelLeft,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { navigationItems, type AppSection } from '../navigation'
import {
  createSidebarCategory,
  moveCategory,
  moveItem,
  normalizeSidebarPreferences,
  type SidebarFieldVisibility,
  type SidebarPreferences,
} from './sidebar-config'

type EditorTab = 'structure' | 'visibility' | 'appearance'
type DragPayload = { kind: 'category'; id: string } | { kind: 'item'; id: AppSection }

interface SidebarCustomizerProps {
  preferences: SidebarPreferences
  onChange: (next: SidebarPreferences | ((current: SidebarPreferences) => SidebarPreferences)) => void
  onReset: () => void
  onClose: () => void
}

const navigationMap = new Map(navigationItems.map((item) => [item.id, item]))

export function SidebarCustomizer({ preferences, onChange, onReset, onClose }: SidebarCustomizerProps) {
  const [tab, setTab] = useState<EditorTab>('structure')
  const [dragPayload, setDragPayload] = useState<DragPayload>()
  const [message, setMessage] = useState('')
  const importInputRef = useRef<HTMLInputElement>(null)

  const visibleCount = useMemo(
    () => navigationItems.filter((item) => preferences.itemVisibility[item.id] !== false).length,
    [preferences.itemVisibility],
  )

  const updateCategory = (categoryId: string, patch: Partial<SidebarPreferences['categories'][number]>) => {
    onChange((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, ...patch } : category,
      ),
    }))
  }

  const addCategory = () => {
    onChange((current) => ({ ...current, categories: [...current.categories, createSidebarCategory()] }))
  }

  const deleteCategory = (categoryId: string) => {
    if (preferences.categories.length <= 1) {
      setMessage('A navegação precisa de pelo menos uma categoria.')
      return
    }
    onChange((current) => {
      const removed = current.categories.find((category) => category.id === categoryId)
      const remaining = current.categories.filter((category) => category.id !== categoryId)
      if (removed?.itemIds.length) remaining[0] = { ...remaining[0], itemIds: [...remaining[0].itemIds, ...removed.itemIds] }
      return { ...current, categories: remaining }
    })
  }

  const toggleItem = (itemId: AppSection) => {
    onChange((current) => ({
      ...current,
      itemVisibility: {
        ...current.itemVisibility,
        [itemId]: current.itemVisibility[itemId] === false,
      },
    }))
  }

  const updateItemOverride = (itemId: AppSection, field: 'label' | 'description', value: string) => {
    onChange((current) => ({
      ...current,
      itemOverrides: {
        ...current.itemOverrides,
        [itemId]: {
          ...current.itemOverrides[itemId],
          [field]: value,
        },
      },
    }))
  }

  const updateField = (field: keyof SidebarFieldVisibility, value: boolean) => {
    onChange((current) => {
      const fields = { ...current.fields, [field]: value }
      if (!fields.itemIcons && !fields.itemLabels) {
        if (field === 'itemIcons') fields.itemLabels = true
        else fields.itemIcons = true
      }
      return { ...current, fields }
    })
  }

  const startDrag = (event: DragEvent, payload: DragPayload) => {
    setDragPayload(payload)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify(payload))
  }

  const resolveDragPayload = (event: DragEvent): DragPayload | undefined => {
    if (dragPayload) return dragPayload
    try {
      return JSON.parse(event.dataTransfer.getData('text/plain')) as DragPayload
    } catch {
      return undefined
    }
  }

  const dropOnCategory = (event: DragEvent, categoryId: string) => {
    event.preventDefault()
    const payload = resolveDragPayload(event)
    if (!payload) return
    if (payload.kind === 'category') onChange((current) => moveCategory(current, payload.id, categoryId))
    else onChange((current) => moveItem(current, payload.id, categoryId))
    setDragPayload(undefined)
  }

  const dropBeforeItem = (event: DragEvent, categoryId: string, beforeItemId: AppSection) => {
    event.preventDefault()
    event.stopPropagation()
    const payload = resolveDragPayload(event)
    if (!payload || payload.kind !== 'item') return
    onChange((current) => moveItem(current, payload.id, categoryId, beforeItemId))
    setDragPayload(undefined)
  }

  const exportPreferences = () => {
    const blob = new Blob([JSON.stringify(preferences, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'fm-data-center-sidebar.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Configuração exportada.')
  }

  const importPreferences = async (file?: File) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as unknown
      onChange(normalizeSidebarPreferences(parsed))
      setMessage('Configuração importada com sucesso.')
    } catch {
      setMessage('O ficheiro não contém uma configuração válida.')
    }
  }

  return (
    <div className="sidebar-editor-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sidebar-editor" role="dialog" aria-modal="true" aria-label="Personalizar barra lateral">
        <header className="sidebar-editor__header">
          <div>
            <span className="eyebrow">Navegação</span>
            <h2>Personalizar barra lateral</h2>
            <p>{preferences.categories.length} categorias · {visibleCount} páginas visíveis</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <nav className="sidebar-editor__tabs" aria-label="Opções da barra lateral">
          <button type="button" className={tab === 'structure' ? 'is-active' : ''} onClick={() => setTab('structure')}>
            <GripVertical size={16} /> Estrutura
          </button>
          <button type="button" className={tab === 'visibility' ? 'is-active' : ''} onClick={() => setTab('visibility')}>
            <Eye size={16} /> Visibilidade
          </button>
          <button type="button" className={tab === 'appearance' ? 'is-active' : ''} onClick={() => setTab('appearance')}>
            <LayoutPanelLeft size={16} /> Aparência
          </button>
        </nav>

        <div className="sidebar-editor__body">
          {tab === 'structure' ? (
            <div className="sidebar-structure-editor">
              <div className="sidebar-editor-note">
                Arrasta categorias para mudar a ordem. Arrasta páginas dentro da mesma categoria ou para outra categoria.
              </div>
              {preferences.categories.map((category) => (
                <article
                  key={category.id}
                  className={category.isVisible ? 'sidebar-category-editor' : 'sidebar-category-editor is-hidden'}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropOnCategory(event, category.id)}
                >
                  <header>
                    <span
                      className="sidebar-drag-handle"
                      draggable
                      onDragStart={(event) => startDrag(event, { kind: 'category', id: category.id })}
                      onDragEnd={() => setDragPayload(undefined)}
                      title="Arrastar categoria"
                    >
                      <GripVertical size={18} />
                    </span>
                    <input
                      value={category.label}
                      onChange={(event) => updateCategory(category.id, { label: event.target.value })}
                      aria-label="Nome da categoria"
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => updateCategory(category.id, { isVisible: !category.isVisible })}
                      title={category.isVisible ? 'Ocultar categoria' : 'Mostrar categoria'}
                    >
                      {category.isVisible ? <Eye size={17} /> : <EyeOff size={17} />}
                    </button>
                    <button
                      type="button"
                      className="icon-button is-danger"
                      onClick={() => deleteCategory(category.id)}
                      title="Apagar categoria"
                    >
                      <Trash2 size={17} />
                    </button>
                  </header>

                  <div className="sidebar-category-editor__items">
                    {category.itemIds.length ? category.itemIds.map((itemId) => {
                      const item = navigationMap.get(itemId)
                      if (!item) return null
                      const Icon = item.icon
                      const visible = preferences.itemVisibility[itemId] !== false
                      return (
                        <div
                          key={itemId}
                          className={visible ? 'sidebar-item-editor' : 'sidebar-item-editor is-hidden'}
                          draggable
                          onDragStart={(event) => startDrag(event, { kind: 'item', id: itemId })}
                          onDragEnd={() => setDragPayload(undefined)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => dropBeforeItem(event, category.id, itemId)}
                        >
                          <GripVertical size={15} />
                          <Icon size={16} />
                          <span className="sidebar-item-editor__text">
                            <input
                              value={preferences.itemOverrides[itemId]?.label ?? item.label}
                              onChange={(event) => updateItemOverride(itemId, 'label', event.target.value)}
                              onMouseDown={(event) => event.stopPropagation()}
                              aria-label={`Nome apresentado para ${item.label}`}
                            />
                            <input
                              value={preferences.itemOverrides[itemId]?.description ?? item.description}
                              onChange={(event) => updateItemOverride(itemId, 'description', event.target.value)}
                              onMouseDown={(event) => event.stopPropagation()}
                              aria-label={`Descrição apresentada para ${item.label}`}
                            />
                          </span>
                          <select
                            value={category.id}
                            onChange={(event) => onChange((current) => moveItem(current, itemId, event.target.value))}
                            aria-label={`Mover ${item.label} para outra categoria`}
                            onMouseDown={(event) => event.stopPropagation()}
                          >
                            {preferences.categories.map((targetCategory) => (
                              <option key={targetCategory.id} value={targetCategory.id}>{targetCategory.label}</option>
                            ))}
                          </select>
                          <button type="button" className="icon-button" onClick={() => toggleItem(itemId)} title={visible ? 'Ocultar página' : 'Mostrar página'}>
                            {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        </div>
                      )
                    }) : <div className="sidebar-empty-category">Arrasta páginas para esta categoria.</div>}
                  </div>
                </article>
              ))}
              <button type="button" className="secondary-button sidebar-add-category" onClick={addCategory}>
                <Plus size={16} /> Adicionar categoria
              </button>
            </div>
          ) : null}

          {tab === 'visibility' ? (
            <div className="sidebar-visibility-editor">
              <header>
                <div>
                  <h3>Páginas visíveis</h3>
                  <p>Ocultar uma página não elimina dados nem impede o acesso através da pesquisa global.</p>
                </div>
                <div className="sidebar-bulk-actions">
                  <button type="button" onClick={() => onChange((current) => ({
                    ...current,
                    itemVisibility: Object.fromEntries(navigationItems.map((item) => [item.id, true])) as Partial<Record<AppSection, boolean>>,
                  }))}>Mostrar todas</button>
                  <button type="button" onClick={() => onChange((current) => ({
                    ...current,
                    itemVisibility: Object.fromEntries(navigationItems.map((item) => [item.id, item.id === 'dashboard'])) as Partial<Record<AppSection, boolean>>,
                  }))}>Só Dashboard</button>
                </div>
              </header>
              <div className="sidebar-visibility-grid">
                {preferences.categories.map((category) => (
                  <section key={category.id}>
                    <h4>{category.label}</h4>
                    {category.itemIds.map((itemId) => {
                      const item = navigationMap.get(itemId)
                      if (!item) return null
                      const Icon = item.icon
                      const visible = preferences.itemVisibility[itemId] !== false
                      const label = preferences.itemOverrides[itemId]?.label || item.label
                      const description = preferences.itemOverrides[itemId]?.description || item.description
                      return (
                        <label key={itemId}>
                          <input type="checkbox" checked={visible} onChange={() => toggleItem(itemId)} />
                          <Icon size={16} />
                          <span><strong>{label}</strong><small>{description}</small></span>
                        </label>
                      )
                    })}
                  </section>
                ))}
              </div>
            </div>
          ) : null}

          {tab === 'appearance' ? (
            <div className="sidebar-appearance-editor">
              <section>
                <h3>Modo de apresentação</h3>
                <div className="sidebar-mode-options">
                  {(['expanded', 'compact', 'hidden'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={preferences.mode === mode ? 'is-active' : ''}
                      onClick={() => onChange((current) => ({ ...current, mode }))}
                    >
                      <LayoutPanelLeft size={18} />
                      <strong>{mode === 'expanded' ? 'Expandida' : mode === 'compact' ? 'Compacta' : 'Oculta'}</strong>
                      <small>{mode === 'expanded' ? 'Texto e ícones' : mode === 'compact' ? 'Navegação por ícones' : 'Máximo espaço de trabalho'}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="sidebar-slider-field">
                <label htmlFor="sidebar-width">Largura da barra</label>
                <input
                  id="sidebar-width"
                  type="range"
                  min="220"
                  max="420"
                  step="2"
                  value={preferences.width}
                  disabled={preferences.mode !== 'expanded'}
                  onChange={(event) => onChange((current) => ({ ...current, width: Number(event.target.value) }))}
                />
                <strong>{preferences.width}px</strong>
              </section>

              <section>
                <h3>Densidade</h3>
                <div className="segmented-control">
                  <button type="button" className={preferences.density === 'comfortable' ? 'is-active' : ''} onClick={() => onChange((current) => ({ ...current, density: 'comfortable' }))}>Confortável</button>
                  <button type="button" className={preferences.density === 'compact' ? 'is-active' : ''} onClick={() => onChange((current) => ({ ...current, density: 'compact' }))}>Compacta</button>
                </div>
              </section>

              <section>
                <h3>Campos da barra lateral</h3>
                <div className="sidebar-field-grid">
                  {([
                    ['brand', 'Marca e logótipo'],
                    ['brandSubtitle', 'Subtítulo da marca'],
                    ['search', 'Pesquisa dentro da barra'],
                    ['categoryLabels', 'Nomes das categorias'],
                    ['itemIcons', 'Ícones das páginas'],
                    ['itemLabels', 'Nomes das páginas'],
                    ['itemDescriptions', 'Descrições das páginas'],
                    ['footer', 'Rodapé e versão'],
                    ['activeIndicator', 'Indicador da página ativa'],
                  ] as Array<[keyof SidebarFieldVisibility, string]>).map(([field, label]) => (
                    <label key={field}>
                      <input type="checkbox" checked={preferences.fields[field]} onChange={(event) => updateField(field, event.target.checked)} />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label>
                    <input
                      type="checkbox"
                      checked={preferences.accordionCategories}
                      onChange={(event) => onChange((current) => ({ ...current, accordionCategories: event.target.checked }))}
                    />
                    <span>Fechar as outras categorias automaticamente</span>
                  </label>
                </div>
              </section>
            </div>
          ) : null}
        </div>

        <footer className="sidebar-editor__footer">
          <div>
            <button type="button" className="secondary-button" onClick={exportPreferences}><Download size={16} /> Exportar JSON</button>
            <button type="button" className="secondary-button" onClick={() => importInputRef.current?.click()}><Upload size={16} /> Importar JSON</button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                void importPreferences(event.target.files?.[0])
                event.target.value = ''
              }}
            />
            <button type="button" className="secondary-button" onClick={() => { onReset(); setMessage('Configuração original reposta.') }}><RotateCcw size={16} /> Repor original</button>
          </div>
          <span className="sidebar-editor__message">{message}</span>
          <button type="button" className="primary-button" onClick={onClose}><Settings2 size={16} /> Concluir</button>
        </footer>
      </section>
    </div>
  )
}
