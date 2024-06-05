import { useEffect, useRef, useState } from 'react'

import * as XLSX from 'xlsx'

import { unityInsertQuery } from '@/Queries'
import {
  getAllSheetNames,
  getCellFunction,
  getCellValue,
  getSheetsProps,
  readFile,
} from '@/Utils'

import Wrapper from '@/components/Wrapper'
import Query from './Query'
import Sheet, { sheetProps } from './Sheet'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type queryData = {
  tipo: number
  nroCuota: number
  fecha: number
  cuota: number
  capital: number
  intereses: number
  saldo: number
}

// const targetSheetNames: 'vehiculo' | 'seguro vehiculo' | 'seguro de vida'

const targetDatabase: string = 'MQTools'
const webpcf: string = 'WEBPCF'
const cellOperationNumber: string = 'C4'

const pattern = ['PERIODO', 'FECHA', 'SALDO', 'INTERESES', 'CAPITAL', 'CUOTA']

const PlanDePagoAdv = () => {
  const [operationNumber, setOperationNumber] = useState<number>(0)
  const [insertQueries, setInsertQueries] = useState<string>('')
  const [sheetsList, setSheetsList] = useState<sheetProps[]>([])
  const [file, setFile] = useState<FileList | null>(null)
  const [webpfcFormula, setWebpfcFormula] = useState<string>('')

  const fileRef = useRef<HTMLInputElement>(null)

  const _getValidSheetsNames = async (file: File) => {
    const validSheets: string[] = []
    try {
      const workbook = await readFile(file)

      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName]
        const rowsToCheck: number = 100
        let isValidSheet: boolean = false

        for (let rowNum = 0; rowNum < rowsToCheck; rowNum++) {
          const header1Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 0 })]
          const header2Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 1 })]
          const header3Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 2 })]
          const header4Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 3 })]
          const header5Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 4 })]
          const header6Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 5 })]

          if (
            !header1Cell &&
            !header2Cell &&
            !header3Cell &&
            !header4Cell &&
            !header5Cell &&
            !header6Cell
          ) {
            continue
          }

          const header1 = header1Cell ? header1Cell.v : ''
          const header2 = header2Cell ? header2Cell.v : ''
          const header3 = header3Cell ? header3Cell.v : ''
          const header4 = header4Cell ? header4Cell.v : ''
          const header5 = header5Cell ? header5Cell.v : ''
          const header6 = header6Cell ? header6Cell.v : ''

          if (
            header1 == pattern[0] &&
            header2 == pattern[1] &&
            header3 == pattern[2] &&
            header4 == pattern[3] &&
            header5 == pattern[4] &&
            header6 == pattern[5]
          ) {
            isValidSheet = true
            continue
          }
        }
        if (isValidSheet) {
          validSheets.push(sheetName)
        }
        return validSheets
      })
    } catch (error) {
      alert(error)
    }
    return validSheets
  }

  const getSheetData = async (
    file: File,
    sheetName: string,
    columnName: string = 'A'
  ): Promise<any> => {
    try {
      const workbook = await readFile(file)
      const sheet = workbook.Sheets[sheetName]

      const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
      const colIndex = XLSX.utils.decode_col(columnName)
      let data: queryData[] = []
      for (
        let rowIndex = columnRange.s.r;
        rowIndex <= columnRange.e.r;
        rowIndex++
      ) {
        const cellAddress = { r: rowIndex, c: colIndex }
        const cellRef = XLSX.utils.encode_cell(cellAddress)
        const nroCuota = sheet[cellRef]?.v
        if (nroCuota !== undefined && typeof nroCuota === 'number') {
          const fecha =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 1 })]?.v
          const saldo =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })]?.v
          const intereses =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })]?.v
          const capital = sheet[
            XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })
          ]?.v
            ? sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })]?.v
            : 0
          const cuota = sheet[
            XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })
          ]?.v
            ? sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })]?.v
            : 0
          let tipo: number = 0
          switch (sheetName) {
            case 'vehiculo':
              tipo = 1
              break

            case 'seguro vehiculo':
              tipo = 2
              break

            case 'seguro de vida':
              tipo = 3
              break
          }
          const rowData: queryData = {
            tipo,
            nroCuota,
            fecha,
            cuota,
            capital,
            intereses,
            saldo,
          }
          data = [...data, rowData]
        }
      }
      return data
    } catch (error) {
      alert(error)
    }

    return
  }

  const createSheetQueries = (queryData: queryData[]) => {
    let result: string = ''
    queryData.forEach((data) => {
      result += unityInsertQuery(operationNumber, data)
    })
    return result
  }

  const createInsertQueries = async (file: File, sheetList: sheetProps[]) => {
    let result: string = `use ${targetDatabase}\n`
    const selectedSheets = sheetList
      .filter((sheet) => sheet.checked)
      .map((sheet) => sheet.name)
    for (const sheet of selectedSheets) {
      const sheetData = await getSheetData(file, sheet)
      result += `---${sheet}---\n`
      result += createSheetQueries(sheetData)
    }
    setInsertQueries(result)
  }

  useEffect(() => {
    if (file && file.length > 0) {
      ;(async () => {
        try {
          // const validSheets = await getValidSheetsNames(file[0])
          const sheetProps = await getSheetsProps(file[0], await getAllSheetNames(file[0]))
          setSheetsList(sheetProps)
          const operationNumber = await getCellValue(
            file[0],
            webpcf,
            cellOperationNumber
          )
          setOperationNumber(operationNumber)
          const formula = await getCellFunction(file[0], webpcf, 'E10')
          setWebpfcFormula(formula)
        } catch (error) {
          alert(error)
        }
      })()
    }
  }, [file])

  const updateSheetChecked = (index: number) => {
    let newSheetList = [...sheetsList]
    newSheetList[index].checked = !newSheetList[index].checked
    setSheetsList(newSheetList)
  }

  const highlightSubstring = (text: string) => {
    let highlightedText = text
    sheetsList
      .map((sheet) => sheet.name)
      .forEach((substring) => {
        const regex = new RegExp(`(${substring})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<b><u>$1</u></b>')
      })
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  return (
    <Wrapper>
      <h2 className="font-bold">Aplicación de plan de pago Unity</h2>
      <section className="grid grid-cols-2 gap-8 items-center">
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <Label htmlFor="externalFile">Archivo: </Label>
          <Input
            id="externalFile"
            ref={fileRef}
            type="file"
            accept=".xls, .xlsm, .xlsx"
            onChange={(event) => setFile(event.currentTarget.files)}
          />
        </div>
      </section>
      {file && file.length > 0 && (
        <>
          <Label htmlFor={webpfcFormula}>Formula en WEBPCF(E10)</Label>
          <h1>{highlightSubstring(webpfcFormula)}</h1>
          {sheetsList
            .sort((a, b) => {
              return a.checked === b.checked ? 0 : a.checked ? -1 : 1
            })
            .map((sheet, index) => (
              <Sheet
                key={index}
                name={sheet.name}
                checked={sheet.checked}
                paymentsQuantity={sheet.paymentsQuantity}
                updateList={() => updateSheetChecked(index)}
              />
            ))}
        </>
      )}
      <Button
        disabled={file === null}
        onClick={() => file && createInsertQueries(file[0], sheetsList)}
      >
        Crear queries
      </Button>
      <Query content={insertQueries} />
    </Wrapper>
  )
}

export default PlanDePagoAdv
