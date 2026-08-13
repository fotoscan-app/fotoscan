import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'

interface Column {
  header: string
  key: string
  width?: number
}

// Builds a single-sheet .xlsx file and wraps it in a downloadable NextResponse.
// Used by the admin export endpoints (customers, guest sessions).
export async function xlsxResponse(
  sheetName: string,
  columns: Column[],
  rows: Record<string, unknown>[],
  filename: string
): Promise<NextResponse> {
  const wb = new ExcelJS.Workbook()
  const sheet = wb.addWorksheet(sheetName)
  sheet.columns = columns
  sheet.addRows(rows)
  sheet.getRow(1).font = { bold: true }
  sheet.getRow(1).alignment = { vertical: 'middle' }
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }

  const buffer = await wb.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
