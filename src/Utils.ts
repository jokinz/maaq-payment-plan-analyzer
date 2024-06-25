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
    console.error(error)
    return []
  }
}

export const getAllSheetsProps = async (file: File): Promise<any> => {
  const webpcf = 'WEBPCF'
  const cellAddress = 'E10'
  try {
    const workbook = await readFile(file)
    const sheetNames = workbook.SheetNames
    let result: Pick<
      sheetProps,
      'name' | 'checked' | 'paymentsQuantity' | 'type'
    >[] = []
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
        { name: sheetNames[sheetName], checked, paymentsQuantity, type: 0 },
      ]
    }
    return result
  } catch (error) {
    alert(error)
    return []
  }
}

export const getSheetsProps = async (
  file: File,
  sheetNames: string[]
): Promise<any> => {
  const webpcf = 'WEBPCF'
  try {
    const workbook = await readFile(file)
    let result: Pick<
      sheetProps,
      'name' | 'checked' | 'paymentsQuantity' | 'type'
    >[] = []
    for (const sheetName in sheetNames) {
      const sheet = workbook.Sheets[sheetNames[sheetName]]
      const paymentsQuantity: number = getPaymentsQuantity(sheet)
      result = [
        ...result,
        {
          name: sheetNames[sheetName],
          checked: true,
          paymentsQuantity,
          type: 0,
        },
      ]
    }
    return result
  } catch (error) {
    console.error(error)
    return []
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
): Promise<boolean> => {
  try {
    const cellFunction = (await getCellFunction(
      file,
      functionSheet,
      functionCell
    )) as string
    if (cellFunction !== null) {
      return cellFunction.includes(name)
    } else {
      return false
    }
  } catch (error) {
    alert(error)
    return false
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
): Promise<string | null> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    const cellFunction = sheet[cellReference]?.f as string
    if (sheet[cellReference].hasOwnProperty('f')) {
      return cellFunction
    } else {
      throw new Error('Función no encontrada en ' + cellReference)
    }
  } catch (error) {
    alert(error)
    return null
  }
}

export const getColumnData = async (
  file: File,
  colIndex: number
): Promise<any[]> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
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
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]

    if (!sheet) {
      throw new Error(`Hoja "${sheetName}" no encontrada`)
    }

    const sheetData: any[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
    })
    const data = sheetData.map((row) => row.map((cell) => ({ value: cell })))
    return data
  } catch (error) {
    alert(error)
  }
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
    console.error(error)
    return []
  }
}

export const findIndexInRange = (
  sheet: XLSX.WorkSheet,
  range: string,
  searchString: string
): { rowIndex: number; colIndex: number } | null => {
  const cellRange = XLSX.utils.decode_range(range)

  for (let rowIndex = cellRange.s.r; rowIndex <= cellRange.e.r; rowIndex++) {
    for (let colIndex = cellRange.s.c; colIndex <= cellRange.e.c; colIndex++) {
      const cellAddress = { c: colIndex, r: rowIndex }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const cell = sheet[cellRef]
      if (
        cell &&
        cell.v &&
        typeof cell.v === 'string' &&
        cell.v.toLowerCase() === searchString.toLowerCase()
      ) {
        return { rowIndex, colIndex }
      }
    }
  }
  return null
}

export const getColumnFormulas = async (
  file: File,
  sheetName: string,
  cellLocation: string
): Promise<string[]> => {
  const formulas: string[] = []
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      throw new Error(`Hoja ${sheetName} no encontrada.`)
    }
    const startCell = XLSX.utils.decode_cell(cellLocation)
    let rowIndex = startCell.r
    const colIndex = startCell.c

    while (true) {
      const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowIndex })
      const cell = sheet[cellAddress]

      if (!cell) {
        break
      }

      if (cell.f) {
        formulas.push(cell.f)
      }

      rowIndex++
    }

    return formulas
  } catch (error) {
    alert(error)
  }

  return formulas
}

export const extractSheetNamesFromFormula = (formula: string): string[] => {
  const sheetNames: Set<string> = new Set()

  const regex = /(?:'([^']+)'|([\p{L}\p{N}_]+))!/gu
  let match

  while ((match = regex.exec(formula)) !== null) {
    if (match[1]) {
      sheetNames.add(match[1])
    } else if (match[2]) {
      sheetNames.add(match[2])
    }
  }

  return Array.from(sheetNames)
}
