export type ImportKind =
  | 'clubs'
  | 'coaches'
  | 'players'
  | 'competitions'
  | 'standings'
  | 'statistics'
  | 'transfers'

export type CellValue = string | number | boolean | Date | null
export type RawRow = Record<string, CellValue>

export interface WorkbookSheet {
  name: string
  headers: string[]
  rows: RawRow[]
}

export interface WorkbookSnapshot {
  fileName: string
  sheets: WorkbookSheet[]
}

export interface ImportPreviewRow {
  sourceSheet: string
  sourceRow: number
  entityKey: string
  values: Record<string, unknown>
  warnings: string[]
  errors: string[]
}

export interface ImportPreview {
  kind: ImportKind
  fileName: string
  rows: ImportPreviewRow[]
  totalSourceRows: number
  validRows: number
  warningRows: number
  errorRows: number
  sourceSheets: string[]
}
