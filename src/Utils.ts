import * as XLSX from 'xlsx'
import { sheetProps } from './components/Sheet'

const WEBPCF: string = 'WEBPCF'

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
  | 'name'
  | 'type'
  | 'checked'
  | 'paymentsQuantity'
  | 'amortizacionInUse'
  | 'interesesInUse'
>

export const getSheetsProps = (
  workbook: XLSX.WorkBook,
  references: WebpcfReferences[]
): PartialSheetProps[] => {
  try {
    let result: PartialSheetProps[] = []
    let amortizacionSheetNames: string[] = []
    let interesesSheetNames: string[] = []

    references.forEach((reference) => {
      reference.amortizacion.forEach((item) => {
        amortizacionSheetNames.push(item.sheetName)
      })
      reference.intereses.forEach((item) => {
        interesesSheetNames.push(item.sheetName)
      })
    })

    amortizacionSheetNames = [...new Set(amortizacionSheetNames)]
    interesesSheetNames = [...new Set(interesesSheetNames)]
    const sheetNames: string[] = [
      ...new Set([...amortizacionSheetNames, ...interesesSheetNames]),
    ]
    result = sheetNames.map((sheetName) => {
      let amortizacionInUse = 0
      let interesesInUse = 0
      references.forEach((item) => {
        if (item.amortizacion.find((e) => e.sheetName === sheetName)) {
          amortizacionInUse++
        }
        if (item.intereses.find((e) => e.sheetName === sheetName)) {
          interesesInUse++
        }
      })
      const paymentsQuantity: number = getPaymentsQuantity(
        workbook.Sheets[sheetName]
      )
      return {
        name: sheetName,
        amortizacionInUse,
        interesesInUse,
        type: 0,
        checked: true,
        paymentsQuantity,
      }
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

export const getCellValueFromWorkbook = (
  workbook: XLSX.WorkBook,
  sheetName: string,
  cellReference: string
): string | number | boolean | Date | undefined => {
  try {
    const sheet = workbook.Sheets[sheetName]
    if (sheet) {
      const cellObject: XLSX.CellObject = sheet[cellReference]
      if (cellObject && cellObject.hasOwnProperty('v')) {
        const cellValue = cellObject.v
        if (cellValue) {
          return cellValue
        } else {
          return 0
        }
      } else {
        return 0
      }
    } else {
      throw new Error(`Hoja ${sheetName} no encontrada`)
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

export const getColumnFormulasFromWebpcf = (
  workbook: XLSX.WorkBook,
  cellLocation: string
): string[] => {
  const formulas: string[] = []
  try {
    const sheet = workbook.Sheets[WEBPCF]
    if (!sheet) {
      throw new Error(`Hoja ${WEBPCF} no encontrada.`)
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

export type CellInfo2 = {
  sheetName: string
  cellReference: string
  value: number
  paymentNumber: number
  date: Date
  type: 'amortizacion' | 'interes'
}

export type WebpcfReferences = {
  date: number
  paymentNumber: number
  amortizacion: {
    sheetName: string
    cellReference: string
    value: number
  }[]
  intereses: {
    sheetName: string
    cellReference: string
    value: number
  }[]
  saldoInsoluto: number
}

const extractSheetNameReferenceValueAndSaldo = (
  workbook: XLSX.WorkBook,
  formula: string
): {
  sheetName: string
  cellReference: string
  value: number
  capital: number
}[] => {
  const regex = /(?:'([^']+)'|([A-Za-z_][\w]*))!([A-Z]+)(\d+)/g
  const cellInfoArray: {
    sheetName: string
    cellReference: string
    value: number
    capital: number
  }[] = []

  const extractReferencesFromSubFormula = (subFormula: string) => {
    let subMatch
    while ((subMatch = regex.exec(subFormula)) !== null) {
      const sheetName = subMatch[1] || subMatch[2]
      const column = subMatch[3]
      const row = parseInt(subMatch[4], 10)
      const cellReference = column + row
      const value = getCellValueFromWorkbook(
        workbook,
        sheetName,
        cellReference
      ) as number

      const sheet = workbook.Sheets[sheetName]
      const searchRange: string = 'A21:J28'
      const capitalIndex = findIndexInRange(sheet, searchRange, 'capital')
      if (!capitalIndex) {
        throw new Error('Nombre de columna capital no encontrado')
      }
      const capitalCellReference = row + capitalIndex.colIndex.toString()
      const capital = getCellValueFromWorkbook(
        workbook,
        sheetName,
        capitalCellReference
      ) as number

      cellInfoArray.push({
        sheetName,
        cellReference,
        value,
        capital,
      })
    }
  }

  const handleSumarSiConjunto = (subFormula: string): void => {
    const cleanSubFormula = subFormula.replace(/['"]/g, '')

    const getColumnLetter = (str: string) => {
      const match = str.match(/([A-Z]+):[A-Z]+$/)
      return match ? match[1] : null
    }
    const getSheetName = (str: string) => {
      const match = str.match(/^([^!]+)!/)
      return match ? match[1] : null
    }

    const [values, rangeCriteria1, criteria1, rangeCriteria2, criteria2] =
      cleanSubFormula.split(',')

    const valuesSheetName = getSheetName(values) as string
    const valuesColLetter = getColumnLetter(values) as string

    const criteria1Value = getCellValueFromWorkbook(workbook, WEBPCF, criteria1)
    const criteria1ColLetter = getColumnLetter(rangeCriteria1) as string

    let value: number

    if (rangeCriteria2 && criteria2) {
      const criteria2Value = getCellValueFromWorkbook(
        workbook,
        WEBPCF,
        criteria2
      )
      const criteria2ColLetter = getColumnLetter(rangeCriteria2) as string
      value = sumColumnBasedOnSearchValue(
        workbook,
        valuesSheetName,
        valuesColLetter,
        criteria1Value,
        criteria1ColLetter,
        criteria2Value,
        criteria2ColLetter
      )
    } else {
      value = sumColumnBasedOnSearchValue(
        workbook,
        valuesSheetName,
        valuesColLetter,
        criteria1Value,
        criteria1ColLetter
      )
    }
    const cellReference = criteria2 ? criteria2 : criteria1
    cellInfoArray.push({
      sheetName: valuesSheetName,
      cellReference,
      value,
      capital: 0,
    })
  }

  extractReferencesFromSubFormula(formula)

  const conditionalFormulaRegex = /SUMIFS\(([^()]+(?:\([^()]*\))?[^()]*)\)/g
  let conditionalMatch
  while ((conditionalMatch = conditionalFormulaRegex.exec(formula)) !== null) {
    const conditionalSubFormula = conditionalMatch[1]
    handleSumarSiConjunto(conditionalSubFormula)
  }
  return cellInfoArray
}

function sumColumnBasedOnSearchValue(
  workbook: XLSX.WorkBook,
  sheetName: string,
  valuesColLetter: string,
  firstSearchValue: string | number | boolean | Date | undefined,
  firstColLetter: string,
  secondSearchValue?: string | number | boolean | Date,
  secondColLetter?: string
): number {
  const worksheet: XLSX.WorkSheet = workbook.Sheets[sheetName]

  if (!worksheet) {
    throw new Error(`Sheet with name "${sheetName}" not found.`)
  }

  const range = XLSX.utils.decode_range(worksheet['!ref'] || '')
  const valuesColIndex = XLSX.utils.decode_col(valuesColLetter)
  const firstColIndex = XLSX.utils.decode_col(firstColLetter)
  let sum = 0
  if (secondSearchValue && secondColLetter) {
    const secondColIndex = XLSX.utils.decode_col(secondColLetter)
    for (let row = range.s.r; row <= range.e.r; row++) {
      const valueCell =
        worksheet[XLSX.utils.encode_cell({ r: row, c: valuesColIndex })]
      const firstCell =
        worksheet[XLSX.utils.encode_cell({ r: row, c: firstColIndex })]
      const secondCell =
        worksheet[XLSX.utils.encode_cell({ r: row, c: secondColIndex })]

      if (
        firstCell &&
        firstCell.v === firstSearchValue &&
        secondCell &&
        secondCell.v === secondSearchValue
      ) {
        const value = valueCell ? valueCell.v : 0
        sum += typeof value === 'number' ? value : 0
      }
    }
  } else {
    for (let row = range.s.r; row <= range.e.r; row++) {
      const firstCell =
        worksheet[XLSX.utils.encode_cell({ r: row, c: firstColIndex })]
      const secondCell =
        worksheet[XLSX.utils.encode_cell({ r: row, c: valuesColIndex })]

      if (firstCell && firstCell.v === firstSearchValue) {
        const value = secondCell ? secondCell.v : 0
        sum += typeof value === 'number' ? value : 0
      }
    }
  }

  return sum
}

export const getWebpcfReferences = (
  workbook: XLSX.WorkBook,
  cellReference: string
): WebpcfReferences[] => {
  try {
    const sheetName = 'WEBPCF'
    const webpcfSheet = workbook.Sheets[sheetName]
    if (!webpcfSheet) {
      throw new Error(`Hoja ${sheetName} no encontrada.`)
    }

    const startCell = XLSX.utils.decode_cell(cellReference)
    const column = startCell.c

    let row = startCell.r
    let cellAddress = XLSX.utils.encode_cell({ r: row, c: column })
    let cell: XLSX.CellObject = webpcfSheet[cellAddress]

    const allReferences: WebpcfReferences[] = []

    while (cell) {
      if (cell.f && cell.t === 'n') {
        const date = webpcfSheet[
          XLSX.utils.encode_cell({
            r: row,
            c: column - 2,
          })
        ]?.v as number
        const paymentNumber = webpcfSheet[
          XLSX.utils.encode_cell({
            r: row,
            c: column - 3,
          })
        ]?.v as number
        const saldoInsoluto = webpcfSheet[
          XLSX.utils.encode_cell({
            r: row,
            c: column + 3,
          })
        ]?.v as number
        const interesesCellObject: XLSX.CellObject =
          webpcfSheet[
            XLSX.utils.encode_cell({
              r: row,
              c: column + 1,
            })
          ]
        let cellInfo: WebpcfReferences = {
          amortizacion: [],
          intereses: [],
          date,
          paymentNumber,
          saldoInsoluto,
        }
        const amortizacionReferences = extractSheetNameReferenceValueAndSaldo(
          workbook,
          cell.f
        )
        cellInfo.amortizacion = amortizacionReferences
        if (interesesCellObject.f) {
          const interesesReferences = extractSheetNameReferenceValueAndSaldo(
            workbook,
            interesesCellObject.f
          )
          cellInfo.intereses = interesesReferences
        }
        allReferences.push(cellInfo)
      }
      row++
      cellAddress = XLSX.utils.encode_cell({ r: row, c: column })
      cell = webpcfSheet[cellAddress]
    }
    const filteredReferences = allReferences.map((reference) => {
      const filteredAmortizacion = reference.amortizacion.filter(
        (item) => item.value !== 0
      )
      const filteredIntereses = reference.intereses.filter(
        (item) => item.value !== 0
      )
      return {
        ...reference,
        amortizacion: filteredAmortizacion,
        intereses: filteredIntereses,
      }
    })
    return filteredReferences
  } catch (error) {
    console.error(error)
    return []
  }
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
