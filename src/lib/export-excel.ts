import * as XLSX from 'xlsx'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SheetData {
  name: string
  data: any[]
  columns: { key: string; label: string }[]
}

/**
 * Export data to an Excel file (.xlsx) with one or more sheets.
 */
export function exportExcel(sheets: SheetData[], filename: string): void {
  const wb = XLSX.utils.book_new()

  for (const sheet of sheets) {
    // Build header row + data rows
    const headers = sheet.columns.map((c) => c.label)
    const rows = sheet.data.map((row) =>
      sheet.columns.map((c) => {
        const val = row[c.key]
        return val ?? ''
      }),
    )

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

    // Auto-width columns
    ws['!cols'] = sheet.columns.map((c) => {
      const maxLen = Math.max(
        c.label.length,
        ...rows.map((r) => String(r[sheet.columns.indexOf(c)] ?? '').length),
      )
      return { wch: Math.min(maxLen + 2, 40) }
    })

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)) // Max 31 chars for sheet name
  }

  XLSX.writeFile(wb, `${filename}.xlsx`)
}
