import * as XLSX from 'xlsx'
import { sheetProps } from './components/Sheet'

export const excelDateToFormattedDate = (excelSerialDate: number): string => {
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

export const getSheet = async (
  file: File,
  sheetName: string
): Promise<XLSX.WorkSheet | undefined> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[sheetName]
    if (sheet) {
      return sheet
    }
    throw new Error(`Hoja ${sheetName} no encontrada`)
  } catch (error) {
    console.error(error)
  }
}

const getCellObject = async (
  file: File,
  sheetName: string,
  cellReference: string
): Promise<XLSX.CellObject | undefined> => {
  try {
    const sheet = await getSheet(file, sheetName)
    if (sheet) {
      const cell: XLSX.CellObject = sheet[cellReference]
      return cell
    }
    throw new Error(`Celda ${cellReference} no encontrada`)
  } catch (error) {
    console.error(error)
  }
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

type PartialSheetProps = Pick<
  sheetProps,
  'name' | 'type' | 'checked' | 'paymentsQuantity'
>
type PartialSheetProps2 = Pick<
  sheetProps,
  'name' | 'type' | 'checked' | 'paymentsQuantity' | 'paymentsQuoted'
>

export const getAllSheetsProps = async (
  file: File
): Promise<PartialSheetProps[]> => {
  const webpcf = 'WEBPCF'
  const cellAddress = 'E10'
  try {
    const workbook = await readFile(file)
    const sheetNames = workbook.SheetNames
    let result: PartialSheetProps[] = []
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
  sheetsNameAndRows: {
    sheetName: string
    cellRows: number[]
  }[]
): Promise<any[]> => {
  try {
    const workbook = await readFile(file)
    let result: PartialSheetProps2[] = []
    sheetsNameAndRows.forEach((item) => {
      const sheet = workbook.Sheets[item.sheetName]
      const paymentsQuantity: number = getPaymentsQuantity(sheet)
      const paymentsQuoted = sheetsNameAndRows.find(
        (elem) => elem.sheetName === item.sheetName
      )?.cellRows as number[]
      result = [
        ...result,
        {
          name: item.sheetName,
          checked: true,
          paymentsQuantity,
          paymentsQuoted,
          type: 0,
        },
      ]
    })
    return result
  } catch (error) {
    console.error(error)
    return []
  }
}

const getPaymentsQuantity = (sheet: XLSX.WorkSheet): number => {
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
): Promise<string | number | boolean | Date | undefined> => {
  try {
    const sheet = await getSheet(file, sheetName)
    if (sheet) {
      const cellObject = await getCellObject(file, sheetName, cellReference)
      if (cellObject && cellObject.hasOwnProperty('v')) {
        const cellValue = cellObject.v
        return cellValue
      }
    } else {
      throw new Error(`Valor no encontrado en ${cellReference}`)
    }
  } catch (error) {
    console.error(error)
  }
}

export const getCellFunction = async (
  file: File,
  sheetName: string,
  cellReference: string
): Promise<string | undefined> => {
  try {
    const cellObject = await getCellObject(file, sheetName, cellReference)
    if (cellObject) {
      if (cellObject.hasOwnProperty('f')) {
        const cellFunction = cellObject.f
        return cellFunction
      } else {
        throw new Error(`Función no encontrada en ${cellReference}`)
      }
    }
  } catch (error) {
    console.error(error)
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

export const getAllContentFromSheet = async (
  file: File,
  sheetName: string
): Promise<any[][] | undefined> => {
  try {
    const sheet = await getSheet(file, sheetName)

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
    console.error(error)
  }
}

export const getColumnNames = async (file: File): Promise<string[]> => {
  try {
    const workbook = await readFile(file)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

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
    const sheet = await getSheet(file, sheetName)
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

export type CellInfo = {
  sheetName: string
  cellRow: number
}

const extractCellReferences = (formula: string): CellInfo[] => {
  const cleanedFormula = formula.replace(/([A-Z]+):([A-Z]+),/g, '')

  const regex = /(?:'([^']+)'|([A-Za-z_][\w]*))!([A-Z]+)(\d+)/g
  let match
  const cellInfoArray: CellInfo[] = []

  while ((match = regex.exec(cleanedFormula)) !== null) {
    const sheetName = match[1] || match[2]
    const column = match[3]
    const row = parseInt(match[4], 10)
    const decodedCell = XLSX.utils.decode_cell(column + row)
    cellInfoArray.push({
      sheetName,
      cellRow: decodedCell.r,
    })
  }

  return cellInfoArray
}


export const getCellReferences = async (
  file: File,
  sheetName: string,
  cellReference: string
): Promise<CellInfo[] | undefined> => {
  try {
    const sheet = await getSheet(file, sheetName)

    if (!sheet) {
      throw new Error(`Hoja ${sheetName} no encontrada.`)
    }

    const startCell = XLSX.utils.decode_cell(cellReference)
    const column = startCell.c

    let row = startCell.r
    let cellAddress = XLSX.utils.encode_cell({ r: row, c: column })
    let cell: XLSX.CellObject = sheet[cellAddress]

    const allReferences: CellInfo[] = []

    while (cell) {
      if (cell.f && cell.t === 'n') {
        const references = extractCellReferences(cell.f)
        allReferences.push(...references)
      }
      row++
      cellAddress = XLSX.utils.encode_cell({ r: row, c: column })
      cell = sheet[cellAddress]
    }

    return allReferences
  } catch (error) {
    console.error(error)
  }
}

export const mergeAndRemoveDuplicates = (
  arr1: CellInfo[],
  arr2: CellInfo[]
): CellInfo[] => {
  const map = new Map<string, CellInfo>()

  const addToMap = (arr: CellInfo[]) => {
    arr.forEach((cell) => {
      const key = `${cell.sheetName}-${cell.cellRow}`
      if (!map.has(key)) {
        map.set(key, cell)
      }
    })
  }

  addToMap(arr1)
  addToMap(arr2)

  return Array.from(map.values())
}

export type sheetPaymentsQuoted = { sheetName: string; cellRows: number[] }

export const groupBySheetName = (cells: CellInfo[]): sheetPaymentsQuoted[] => {
  const sheetMap = new Map<string, Set<number>>()

  cells.forEach((cell) => {
    if (!sheetMap.has(cell.sheetName)) {
      sheetMap.set(cell.sheetName, new Set<number>())
    }
    sheetMap.get(cell.sheetName)?.add(cell.cellRow)
  })

  return Array.from(sheetMap.entries()).map(([sheetName, cellRowsSet]) => ({
    sheetName,
    cellRows: Array.from(cellRowsSet),
  }))
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

export const getLastCellValue = async (
  file: File,
  sheetName: string,
  columnName: string
): Promise<number | undefined> => {
  try {
    const sheet = await getSheet(file, sheetName)
    if (sheet) {
      const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
      const colIndex = XLSX.utils.decode_col(columnName)

      let lastCellValue

      for (
        let rowIndex = columnRange.s.r;
        rowIndex <= columnRange.e.r;
        rowIndex++
      ) {
        const cellAddress = { r: rowIndex, c: colIndex }
        const cellRef = XLSX.utils.encode_cell(cellAddress)
        const cellValue = sheet[cellRef]?.v

        if (cellValue !== undefined && typeof cellValue === 'number') {
          lastCellValue = cellValue
        }
      }
      return lastCellValue
    }
  } catch (error) {
    console.error(error)
  }
}

export const validateWebpcfData = async (
  file: File,
  columnName: string
): Promise<undefined> => {
  const WEBPCF = 'WEBPCF'
  try {
    const sheet = await getSheet(file, WEBPCF)
    if (!sheet) {
      throw new Error(`Hoja ${WEBPCF} no encontrada.`)
    }
    const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
    const colIndex = XLSX.utils.decode_col(columnName)
    const paymentErrorList: number[] = []

    for (
      let rowIndex = columnRange.s.r;
      rowIndex <= columnRange.e.r;
      rowIndex++
    ) {
      const cellAddress: XLSX.CellAddress = { r: rowIndex, c: colIndex }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const numCuota = sheet[cellRef]?.v

      if (typeof numCuota === 'number') {
        const siguienteNumCuota =
          sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex })]?.v
        if (siguienteNumCuota) {
          const fechVenc =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 1 })]?.v
          const siguienteFechVenc =
            sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 1 })]
              ?.v
          const cuota =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })]?.v
          const amortizacion =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })]?.v
          const siguienteAmortizacion =
            sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 3 })]
              ?.v
          const intereses =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })]?.v
          const seguros =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 5 })]?.v
          const saldoInsoluto =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })]?.v
          const siguienteSaldoInsoluto =
            sheet[XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 6 })]
              ?.v

          if (
            seguros + intereses + amortizacion - cuota !== 0 ||
            saldoInsoluto - siguienteAmortizacion - siguienteSaldoInsoluto !==
              0 ||
            siguienteNumCuota - numCuota !== 1 ||
            siguienteFechVenc - fechVenc < 28 ||
            siguienteFechVenc - fechVenc > 31
          ) {
            paymentErrorList.push(numCuota)
          }
        }
      }
    }
    if (paymentErrorList.length > 0) {
      let errorMessage = ''
      paymentErrorList.forEach((payment) => {
        errorMessage += `Error de validación en cuota N°: ${payment}\n`
      })
      alert(errorMessage)
    } else {
      alert(`Sin errores encontrados en los montos`)
    }
    return
  } catch (error) {
    alert(error)
  }
}

// TODO: update types
export const createUpdateQueries = async (
  file: File,
  sheetName: string,
  columnName: string,
  cellOperationNumber: string
): Promise<any> => {
  try {
    const sheet = await getSheet(file, sheetName)
    if (!sheet) {
      throw new Error(`Hoja ${sheetName} no encontrada.`)
    }
    const operationNumber = sheet[cellOperationNumber]?.v

    const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
    const colIndex = XLSX.utils.decode_col(columnName)

    let concatenatedQueries = `use SCA_HIPOTEC\nGO\n`

    for (
      let rowIndex = columnRange.s.r;
      rowIndex <= columnRange.e.r;
      rowIndex++
    ) {
      const cellAddress: XLSX.CellAddress = { r: rowIndex, c: colIndex }
      const cellRef = XLSX.utils.encode_cell(cellAddress)
      const numCuota = sheet[cellRef]?.v

      if (typeof numCuota === 'number') {
        const fechVenc =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 1 })]?.v
        const cuota =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })]?.v
        const amortizacion =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })]?.v
        const intereses =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })]?.v
        const seguros =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 5 })]?.v
        const saldoInsoluto =
          sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })]?.v

        const rowData = {
          amortizacion,
          intereses,
          fechVenc,
          seguros,
          cuota,
          saldoInsoluto,
          operationNumber,
          numCuota,
        }

        function createUpdateQueryLine(rowData: any) {
          const fld_col_amor = Math.round(rowData.amortizacion)
          const fld_col_int = Math.round(rowData.intereses)
          const fld_col_fven = excelDateToFormattedDate(rowData.fechVenc)
          const fld_col_segu = Math.round(rowData.seguros)
          const fld_col_cuo = Math.round(rowData.cuota)
          const fld_col_cuos = Math.round(rowData.cuota - rowData.seguros)

          let fld_col_salc =
            rowData.cuota > 0
              ? Math.round(rowData.cuota)
              : rowData.saldoInsoluto

          const fld_col_sal = Math.round(rowData.saldoInsoluto)

          const query = `Update col set fld_col_amor = ${fld_col_amor}, fld_col_int = ${fld_col_int}, fld_col_fven = '${fld_col_fven}', fld_col_segu = ${fld_col_segu}, fld_col_cuo = ${fld_col_cuo}, fld_col_cuos = ${fld_col_cuos}, fld_col_salc = case when fld_col_salc > 0 then ${fld_col_salc} else fld_col_salc end , fld_col_sal = ${fld_col_sal} where fld_col_oper = ${rowData.operationNumber} and fld_col_ncu = ${rowData.numCuota}`

          return query
        }

        const query = createUpdateQueryLine(rowData)
        concatenatedQueries += query + '\n'
      }
    }

    return concatenatedQueries
  } catch (error) {
    alert(error)
  }
}
