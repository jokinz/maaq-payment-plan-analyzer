import { useRef, useState, useEffect } from 'react'

import * as XLSX from 'xlsx'

import { unityInsertQuery } from '@/Queries'
import {
  extractSheetNamesFromFormula,
  findIndexInRange,
  getAllSheetNames,
  getCellFunction,
  getCellValue,
  getColumnFormulas,
  getSheetsProps,
  readFile,
} from '@/Utils'

import Wrapper from '@/components/Wrapper'
import Query from './Query'
import Sheet, { sheetProps } from './Sheet'

import FormField from './FormField'
import { LoadingSpinner } from './LoadingSpinner'
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
const starterFunctionCellLocation: string = 'E10'

const pattern = ['PERIODO', 'FECHA', 'SALDO', 'INTERESES', 'CAPITAL', 'CUOTA']

const PlanDePagoAdv = () => {
  const [operationNumber, setOperationNumber] = useState<number>(0)
  const [insertQueries, setInsertQueries] = useState<string>('')
  const [sheetsList, setSheetsList] = useState<sheetProps[]>([])

  const [file, setFile] = useState<FileList | null>(null)
  const [webpfcFunction, setWebpfcFunction] = useState<string>('')
  const [functionCellLocation, setFunctionCellLocation] = useState(
    starterFunctionCellLocation
  )
  const [loading, setLoading] = useState<boolean>(false)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const getValidSheetsNames = async (file: File) => {
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
          const header7Cell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: 6 })]

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
          if (header6 !== pattern[5] && header7Cell) {
            const header7 = header7Cell ? header7Cell.v : ''
            if (
              header1 == pattern[0] &&
              header2 == pattern[1] &&
              header3 == pattern[2] &&
              header4 == pattern[3] &&
              header5 == pattern[4] &&
              header7 == pattern[5]
            ) {
              isValidSheet = true
              continue
            }
          } else {
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

  const checkIfSelectedSheetsMissType = () => {
    const result: boolean = sheetsList
      .filter((sheet: sheetProps) => sheet.checked)
      .some((sheet: sheetProps) => sheet.type === 0)
    return result
  }

  const getSheetDataOld = async (
    file: File,
    sheetName: string,
    tipo: number,
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

  const getSheetData = async (
    file: File,
    sheetName: string,
    tipo: number,
    searchRange: string = 'A25:J28'
  ): Promise<any> => {
    try {
      let sheetData: {
        periodo: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
        fecha: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
        saldo: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
        intereses: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
        capital: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
        cuota: {
          index: {
            rowIndex: number
            colIndex: number
          } | null
        }
      } = {
        periodo: {
          index: null,
        },
        fecha: {
          index: null,
        },
        saldo: {
          index: null,
        },
        intereses: {
          index: null,
        },
        capital: {
          index: null,
        },
        cuota: {
          index: null,
        },
      }
      const workbook = await readFile(file)
      const sheet = workbook.Sheets[sheetName]
      const periodoIndex = findIndexInRange(sheet, searchRange, 'periodo')
      const fechaIndex = findIndexInRange(sheet, searchRange, 'fecha')
        ? findIndexInRange(sheet, searchRange, 'fecha')
        : {
            rowIndex: 24,
            colIndex: 1,
          }
      const saldoIndex = findIndexInRange(sheet, searchRange, 'saldo')
      const interesesIndex = findIndexInRange(sheet, searchRange, 'intereses')
      const capitalIndex = findIndexInRange(sheet, searchRange, 'capital')
      const cuotaIndex = findIndexInRange(sheet, searchRange, 'cuota')
      sheetData.periodo.index = periodoIndex
      sheetData.fecha.index = fechaIndex
      sheetData.saldo.index = saldoIndex
      sheetData.intereses.index = interesesIndex
      sheetData.capital.index = capitalIndex
      sheetData.cuota.index = cuotaIndex

      const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
      let data: queryData[] = []

      if (
        sheetData.periodo.index &&
        sheetData.fecha.index &&
        sheetData.saldo.index &&
        sheetData.intereses.index &&
        sheetData.capital.index &&
        sheetData.cuota.index
      ) {
        for (
          let rowIndex = columnRange.s.r;
          rowIndex <= columnRange.e.r;
          rowIndex++
        ) {
          const cellAddress: {
            r: number
            c: number
          } = { r: rowIndex, c: sheetData.periodo.index.colIndex }
          const cellRef = XLSX.utils.encode_cell(cellAddress)
          const nroCuota = sheet[cellRef]?.v
          if (nroCuota !== undefined && typeof nroCuota === 'number') {
            const fecha =
              sheet[
                XLSX.utils.encode_cell({
                  r: rowIndex,
                  c: sheetData.fecha.index.colIndex,
                })
              ]?.v
            const saldo =
              sheet[
                XLSX.utils.encode_cell({
                  r: rowIndex,
                  c: sheetData.saldo.index.colIndex,
                })
              ]?.v
            const intereses =
              sheet[
                XLSX.utils.encode_cell({
                  r: rowIndex,
                  c: sheetData.intereses.index.colIndex,
                })
              ]?.v
            const capital = sheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: sheetData.capital.index.colIndex,
              })
            ]?.v
              ? sheet[
                  XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: sheetData.capital.index.colIndex,
                  })
                ]?.v
              : 0
            const cuota = sheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: sheetData.cuota.index.colIndex,
              })
            ]?.v
              ? sheet[
                  XLSX.utils.encode_cell({
                    r: rowIndex,
                    c: sheetData.cuota.index.colIndex,
                  })
                ]?.v
              : 0

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
    const operationNumber = await getCellValue(
      file,
      webpcf,
      cellOperationNumber
    )
    let result: string = `--------OP ${operationNumber}--------\n`
    const selectedSheets = sheetList
      .filter((sheet) => sheet.checked)
      .map((sheet) => {
        return { name: sheet.name, type: sheet.type }
      })
    for (const sheet of selectedSheets) {
      const sheetData = await getSheetData(file, sheet.name, sheet.type)
      result += `---${sheet.name}---\n`
      result += createSheetQueries(sheetData)
    }
    setInsertQueries(result)
  }

  const getData = async (file: File) => {
    setLoading(true)
    try {
      const cellfunction = await getCellFunction(
        file,
        webpcf,
        functionCellLocation
      )
      if (cellfunction) {
        setWebpfcFunction(cellfunction)
        // const sheets = await getValidSheetsNames(file)
        const sheets = await getAllSheetNames(file)
        const sheetProps = await getSheetsProps(
          file,
          sheets,
          functionCellLocation
        )
        setSheetsList(sheetProps)
        const operationNumber = await getCellValue(
          file,
          webpcf,
          cellOperationNumber
        )
        setOperationNumber(operationNumber)
      } else {
        setWebpfcFunction('')
        setSheetsList([])
        setOperationNumber(0)
      }
    } catch (error) {
      alert(error)
    } finally {
      setLoading(false)
      setDataLoaded(true)
    }
  }

  const updateSheetChecked = (index: number) => {
    let newSheetList = [...sheetsList]
    newSheetList[index].checked = !newSheetList[index].checked
    setSheetsList(newSheetList)
  }

  const updateSheetType = (index: number, type: number) => {
    let newSheetList = [...sheetsList]
    newSheetList[index].type = type
    setSheetsList(newSheetList)
  }

  const highlightSubstring = (text: string) => {
    let highlightedText = text
    extractSheetNamesFromFormula(webpfcFunction)
      .map((sheetname) => sheetname)
      .forEach((substring) => {
        const regex = new RegExp(`(${substring})`, 'gi')
        highlightedText = highlightedText.replace(regex, '<b><u>$1</u></b>')
      })
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  useEffect(() => {
    setDataLoaded(false)
    setInsertQueries('')
  }, [file]);

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
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <FormField
            htmlFor="formulaCellLocation"
            label="Celda de fórmula"
            value={functionCellLocation}
            onChange={(event) => setFunctionCellLocation(event.target.value)}
          />
        </div>
        <Button
          disabled={file === null}
          onClick={() => file && file.length > 0 && getData(file[0])}
        >
          Cargar data
        </Button>
      </section>
      {loading && <LoadingSpinner />}

      {dataLoaded && (
        <>
          {webpfcFunction !== '' ? (
            <>
              <Label htmlFor={webpfcFunction}>
                Formula en WEBPCF({functionCellLocation})
              </Label>
              <h1>{highlightSubstring(webpfcFunction)}</h1>
              {sheetsList
                .sort((a, b) => {
                  return a.checked === b.checked ? 0 : a.checked ? -1 : 1
                })
                .map((sheet, index) => (
                  <Sheet
                    key={index}
                    index={index}
                    name={sheet.name}
                    checked={sheet.checked}
                    type={sheet.type}
                    paymentsQuantity={sheet.paymentsQuantity}
                    updateSheetChecked={updateSheetChecked}
                    updateSheetType={updateSheetType}
                  />
                ))}
              <Button
                disabled={checkIfSelectedSheetsMissType()}
                onClick={() => file && createInsertQueries(file[0], sheetsList)}
              >
                Crear queries
              </Button>
              <Query content={insertQueries} />
            </>
          ) : (
            <h1 className="bold text-red-600">Fórmula no encontrada</h1>
          )}
        </>
      )}
    </Wrapper>
  )
}

export default PlanDePagoAdv
