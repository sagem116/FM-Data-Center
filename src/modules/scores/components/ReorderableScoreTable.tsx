import { useMemo, useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { mergeColumnOrder, moveColumn } from '../../rankings/utils/column-order'

export interface ScoreTableColumn<Row> {
  key: string
  label: string
  help?: string
  value: (row: Row, index: number) => unknown
  render?: (row: Row, index: number) => ReactNode
}

type SortDirection = 'asc' | 'desc'
type ColumnOrderMap = Record<string, string[]>
const COLUMN_ORDER_KEY = 'fm-data-center-score-column-orders-v1'

function loadColumnOrders(): ColumnOrderMap {
  try {
    return JSON.parse(localStorage.getItem(COLUMN_ORDER_KEY) ?? '{}') as ColumnOrderMap
  } catch {
    return {}
  }
}
function persistColumnOrders(orders: ColumnOrderMap) {
  localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(orders))
}
function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const factor = direction === 'asc' ? 1 : -1
  if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor
  if (a == null && b != null) return 1
  if (a != null && b == null) return -1
  return String(a ?? '').localeCompare(String(b ?? ''), 'pt', { numeric: true, sensitivity: 'base' }) * factor
}

export function ReorderableScoreTable<Row>({
  tableKey,
  columns: baseColumns,
  rows,
  rowKey,
  emptyMessage = 'Sem dados para estes filtros.',
  maxRows,
}: {
  tableKey: string
  columns: ScoreTableColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row, index: number) => string
  emptyMessage?: string
  maxRows?: number
}) {
  const [orders, setOrders] = useState<ColumnOrderMap>(loadColumnOrders)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState(baseColumns[0]?.key ?? '')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const available = useMemo(() => baseColumns.map((column) => column.key), [baseColumns])
  const columns = useMemo(() => {
    const order = mergeColumnOrder(orders[tableKey], available)
    const byKey = new Map(baseColumns.map((column) => [column.key, column]))
    return order.map((key) => byKey.get(key)).filter((column): column is ScoreTableColumn<Row> => Boolean(column))
  }, [orders, tableKey, available, baseColumns])
  const columnMap = useMemo(() => new Map(columns.map((column) => [column.key, column])), [columns])
  const sortedRows = useMemo(() => {
    const column = columnMap.get(sortKey) ?? columns[0]
    const indexed = rows.map((row, index) => ({ row, index }))
    indexed.sort((a, b) => compareValues(column?.value(a.row, a.index), column?.value(b.row, b.index), sortDirection))
    const limited = typeof maxRows === 'number' ? indexed.slice(0, maxRows) : indexed
    return limited
  }, [rows, columnMap, columns, sortKey, sortDirection, maxRows])
  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else {
      setSortKey(key)
      setSortDirection(key === 'rank' || key === 'name' || key === 'entity' ? 'asc' : 'desc')
    }
  }
  const reorderColumn = (target: string) => {
    if (!draggedColumn) return
    const nextOrder = moveColumn(columns.map((column) => column.key), draggedColumn, target)
    const next = { ...orders, [tableKey]: nextOrder }
    setOrders(next)
    persistColumnOrders(next)
    setDraggedColumn(null)
  }
  const resetColumnOrder = () => {
    const next = { ...orders }
    delete next[tableKey]
    setOrders(next)
    persistColumnOrders(next)
  }

  return <>
    <div className="score-table-actions"><span>Arrasta os cabeçalhos para reorganizar. Clica para ordenar.</span><button className="secondary-button" onClick={resetColumnOrder}>Repor ordem</button></div>
    <div className="table-scroll"><table className="preview-table score-profile-table"><thead><tr>{columns.map((column) => <th key={column.key} title={column.help} className={`reorderable-header ${draggedColumn === column.key ? 'is-dragging' : ''}`} draggable onDragStart={() => setDraggedColumn(column.key)} onDragEnd={() => setDraggedColumn(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorderColumn(column.key)}><span className="column-drag-handle" title="Arrastar para mudar a ordem"><GripVertical size={14} /></span><button type="button" className="column-sort-button" onClick={() => toggleSort(column.key)}>{column.label}{sortKey === column.key && <span className="sort-indicator">{sortDirection === 'asc' ? '▲' : '▼'}</span>}</button></th>)}</tr></thead><tbody>
      {sortedRows.map(({ row, index }, displayIndex) => <tr key={rowKey(row, index)}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row, displayIndex) : String(column.value(row, displayIndex) ?? '—')}</td>)}</tr>)}
      {!sortedRows.length && <tr><td colSpan={columns.length}>{emptyMessage}</td></tr>}
    </tbody></table></div>
  </>
}
