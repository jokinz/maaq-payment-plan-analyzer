import * as XLSX from 'xlsx'
import { sheetProps } from './components/Sheet'

export const excelDateToFormattedDate = (excelSerialDate: number) => {
  const excelEpoch = new Date('1899-12-31T00:00:00.000Z')
  const excelDate = new Date(
    excelEpoch.getTime() + excelSerialDate * 24 * 60 * 60 * 1000
  )

  const year = excelDate.getFullYear()
  const month = (excelDate.getMonth() + 1).toString().padStart(2, '0')
  const day = excelDate.getDate().toString().padStart(2, '0')

  const formattedDate = `${year}${month}${day}`
  return formattedDate
}

export const readFile = (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        if (typeof data === 'string' || data instanceof ArrayBuffer) {
          const workbook = XLSX.read(data, { type: 'array' })

          resolve(workbook)
        } else {
          reject(new Error('Invalid file content type'))
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsArrayBuffer(file)
  })
}

export const getAllSheetNames = async (file: File): Promise<string[]> => {
  try {
    const workbook = await readFile(file)
    return workbook.SheetNames
  } catch (error) {
    alert(error)
    return []
  }
}

export const getAllSheetsProps = async (file: File): Promise<any> => {
  const webpcf = 'WEBPCF'
  const cellAddress = 'E10'
  try {
    const workbook = await readFile(file)
    const sheetNames = workbook.SheetNames
    let result: Omit<sheetProps, 'updateList'>[] = []
    for (const sheetName in sheetNames) {
      const checked: boolean = (await cellFunctionContainsSheetName(
        file,
        webpcf,
        cellAddress,
        sheetNames[sheetName]
      )) as boolean
      const sheet = workbook.Sheets[sheetNames[sheetName]]
      const paymentsQuantity: number = getPaymentsQuantity(sheet)
      result = [
        ...result,
        { name: sheetNames[sheetName], checked, paymentsQuantity },
      ]
    }
    return result
  } catch (error) {
    alert(error)
  }
}

export const getSheetsProps = async (
  file: File,
  sheetNames: string[]
): Promise<any> => {
  const webpcf = 'WEBPCF'
  const cellAddress = 'E10'
  try {
    const workbook = await readFile(file)
    let result: Omit<sheetProps, 'updateList'>[] = []
    for (const sheetName in sheetNames) {
      const checked: boolean = (await cellFunctionContainsSheetName(
        file,
        webpcf,
        cellAddress,
        sheetNames[sheetName]
      )) as boolean
      const sheet = workbook.Sheets[sheetNames[sheetName]]
      const paymentsQuantity: number = getPaymentsQuantity(sheet)
      result = [
        ...result,
        { name: sheetNames[sheetName], checked, paymentsQuantity },
      ]
    }
    return result
  } catch (error) {
    alert(error)
  }
}

const getPaymentsQuantity = (sheet: XLSX.WorkSheet) => {
  let result: number = 0
  const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
  const colIndex = XLSX.utils.decode_col('A')
  for (
    let rowIndex = columnRange.s.r;
    rowIndex <= columnRange.e.r;
    rowIndex++
  ) {
    const cellAddress = { r: rowIndex, c: colIndex }
    const cellRef = XLSX.utils.encode_cell(cellAddress)
    const numCuota = sheet[cellRef]?.v
    if (numCuota !== undefined && typeof numCuota === 'number') {
      result++
    }
  }
  return result
}

const cellFunctionContainsSheetName = async (
  file: File,
  functionSheet: string,
  functionCell: string,
  name: string
) => {
  try {
    const cellFunction = (await getCellFunction(
      file,
      functionSheet,
      functionCell
    )) as string
    return cellFunction.includes(name)
  } catch (error) {
    alert(error)
  }
}

export const getCellValue = async (
  file: File,
  sheetName: string,
  cellReference: string
): Promise<any> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    const cellValue = sheet[cellReference]?.v
    return cellValue
  } catch (error) {
    alert(error)
  }
}

export const getCellFunction = async (
  file: File,
  sheetName: string,
  cellReference: string
): Promise<any> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    const cellValue = sheet[cellReference]?.f
    return cellValue
  } catch (error) {
    alert(error)
  }
}

export const getColumnData = async (
  file: File,
  sheetName: string,
  colIndex: number,
): Promise<any[]> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    let columnData: any[] = []
    const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
    for (
      let rowIndex = columnRange.s.r;
      rowIndex <= columnRange.e.r;
      rowIndex++
    ) {
      const cellAddress = { r: rowIndex, c: colIndex }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const numCuota = sheet[cellRef]?.v

      if (numCuota !== undefined && typeof numCuota === 'number') {
        const operationNumber =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })]?.v
        columnData.push(operationNumber)
      }
    }
    return columnData
  } catch (error) {
    alert(error)
  }
  return []
}

export const getSheetData = async (
  file: File,
  sheetName: string
): Promise<any> => {
  const workbook = await readFile(file)
  const sheet = workbook.Sheets[sheetName]

  if (!sheet) {
    throw new Error(`Sheet with name "${sheetName}" not found`)
  }

  const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  })
  const data = sheetData.map((row) => row.map((cell) => ({ value: cell })))
  return data
}

export const getColumnNames = async (file: File): Promise<string[]> => {
  try {
    const workbook = await readFile(file)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    const range = XLSX.utils.decode_range(sheet['!ref'] || '')
    let found = false
    let startRow = 0
    let startCol = 0

    for (let R = range.s.r; R <= range.e.r && !found; ++R) {
      for (let C = range.s.c; C <= range.e.c && !found; ++C) {
        const cellAddress = { c: C, r: R }
        const cellRef = XLSX.utils.encode_cell(cellAddress)
        const cellValue = sheet[cellRef]?.v
        if (cellValue !== undefined) {
          startRow = R
          startCol = C
          found = true
        }
      }
    }

    if (!found) {
      return []
    }

    const values: string[] = []
    let col = startCol

    while (true) {
      const cellAddress = { c: col, r: startRow }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const cellValue = sheet[cellRef]?.v

      if (cellValue === undefined) {
        break
      }

      values.push(cellValue.toString())
      col++
    }

    return values
  } catch (error) {
    alert(error)
    return []
  }
}
