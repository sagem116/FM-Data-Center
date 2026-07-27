import * as XLSX from 'xlsx'
import type { RawRow, WorkbookSheet, WorkbookSnapshot } from './types'
import { normalizeHeader } from './normalizers'

function uniqueHeaders(values: unknown[]): string[] {
  const counts = new Map<string, number>()
  return values.map((value, index) => {
    const base = normalizeHeader(value, index)
    const count = (counts.get(base) ?? 0) + 1
    counts.set(base, count)
    return count === 1 ? base : `${base}_${count}`
  })
}

export async function readWorkbook(file: File): Promise<WorkbookSnapshot> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true })
  const sheets: WorkbookSheet[] = workbook.SheetNames.map((name) => {
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[name], {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    })
    const headers = uniqueHeaders(matrix[0] ?? [])
    const rows = matrix.slice(1).map((cells) => {
      const row: RawRow = {}
      headers.forEach((header, index) => {
        const value = cells[index]
        row[header] = value instanceof Date ? value : (value as RawRow[string]) ?? null
      })
      return row
    })
    return { name, headers, rows }
  })
  return { fileName: file.name, sheets }
}
