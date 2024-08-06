import { useState } from 'react'

import * as XLSX from 'xlsx'

import { LoadingSpinner } from './LoadingSpinner'
import { queryData } from './PlanDePagoAdv'
import Query from './Query'
import Sheet, { sheetProps } from './Sheet'

import { Button } from './ui/button'

import {
  extractSheetNamesFromFormula,
  findIndexInRange,
  getCellValueFromWorkbook,
  getColumnFormulasFromWebpcf,
  getSheet,
  getSheetsProps,
  getWebpcfReferences,
  readFile,
  WebpcfReferences,
} from '@/Utils'

import { unityInsertQuery } from '@/Queries'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'

type props = {
  file: File
}

const WEBPCF: string = 'WEBPCF'
const cellOperationNumber: string = 'C4'
const AmortizacionFirstCellLocation = 'E10'
const InteresesFirstCellLocation = 'F10'

const PlanDePagoDetalles = ({ file }: props) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)

  const [operationNumber, setOperationNumber] = useState<number>(0)
  const [sheetsList, setSheetsList] = useState<sheetProps[]>([])
  const [insertQueries, setInsertQueries] = useState<string>('')
  const [deleteOperation, setDeleteOperation] = useState<boolean>(true)

  const [webpfcFunctionsList, setWebpfcFunctionsList] = useState<string[]>([])

  const [amortizacionFunctionList, setAmortizacionFunctionList] = useState<
    string[]
  >([])
  const [interesesFunctionList, setInteresesFunctionList] = useState<string[]>(
    []
  )

  const [webpcfReferences, setWebpcfReferences] = useState<WebpcfReferences[]>(
    []
  )

  const [nanQuantity, setNanQuantity] = useState(0)

  const checkIfSelectedSheetsMissType = (sheetsList: sheetProps[]): boolean => {
    const result: boolean = sheetsList
      .filter((sheet: sheetProps) => sheet.checked)
      .some((sheet: sheetProps) => sheet.type === 0)
    return result
  }

  const getSheetData = async (
    file: File,
    sheetName: string,
    tipo: number,
    paymentsQuoted: number[],
    searchRange: string = 'A21:J28'
  ): Promise<queryData[]> => {
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
      const sheet = await getSheet(file, sheetName)
      if (!sheet) {
        throw new Error(`Hoja ${sheetName} no encontrada.`)
      }
      const periodoIndex = findIndexInRange(sheet, searchRange, 'periodo')
      if (!periodoIndex) {
        throw new Error('Nombre de columna periodo no encontrado')
      }
      const fechaIndex = findIndexInRange(sheet, searchRange, 'fecha')
        ? findIndexInRange(sheet, searchRange, 'fecha')
        : {
            rowIndex: 24,
            colIndex: 1,
          }
      if (!fechaIndex) {
        throw new Error('Nombre de columna fecha no encontrado')
      }
      const saldoIndex = findIndexInRange(sheet, searchRange, 'saldo')
      if (!saldoIndex) {
        throw new Error('Nombre de columna saldo no encontrado')
      }
      const interesesIndex = findIndexInRange(sheet, searchRange, 'intereses')
      if (!interesesIndex) {
        throw new Error('Nombre de columna intereses no encontrado')
      }
      const capitalIndex = findIndexInRange(sheet, searchRange, 'capital')
      if (!capitalIndex) {
        throw new Error('Nombre de columna capital no encontrado')
      }
      const cuotaIndex = findIndexInRange(sheet, searchRange, 'cuota')
      if (!cuotaIndex) {
        throw new Error('Nombre de columna cuota no encontrado')
      }
      sheetData.periodo.index = periodoIndex
      sheetData.fecha.index = fechaIndex
      sheetData.saldo.index = saldoIndex
      sheetData.intereses.index = interesesIndex
      sheetData.capital.index = capitalIndex
      sheetData.cuota.index = cuotaIndex

      const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
      let data: queryData[] = []

      const orderedPaymentsQuotedIndexes = paymentsQuoted.sort()
      orderedPaymentsQuotedIndexes.forEach((rowIndex) => {
        const cellAddress: {
          r: number
          c: number
        } = { r: rowIndex, c: periodoIndex.colIndex }
        const cellRef = XLSX.utils.encode_cell(cellAddress)
        const nroCuota = sheet[cellRef]?.v
        if (typeof nroCuota === 'number') {
          const fecha =
            sheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: fechaIndex.colIndex,
              })
            ]?.v
          const saldo =
            sheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: saldoIndex.colIndex,
              })
            ]?.v
          const intereses =
            sheet[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: interesesIndex.colIndex,
              })
            ]?.v
          const capital = sheet[
            XLSX.utils.encode_cell({
              r: rowIndex,
              c: capitalIndex.colIndex,
            })
          ]?.v
            ? sheet[
                XLSX.utils.encode_cell({
                  r: rowIndex,
                  c: capitalIndex.colIndex,
                })
              ].v
            : 0

          const rowData: queryData = {
            tipo,
            nroCuota,
            fecha,
            capital,
            intereses,
            saldo,
          }
          data = [...data, rowData]
        }
      })
      // for (
      //   let rowIndex = columnRange.s.r;
      //   rowIndex <= columnRange.e.r;
      //   rowIndex++
      // ) {
      //   const cellAddress: {
      //     r: number
      //     c: number
      //   } = { r: rowIndex, c: sheetData.periodo.index.colIndex }
      //   const cellRef = XLSX.utils.encode_cell(cellAddress)
      //   const nroCuota = sheet[cellRef]?.v
      //   if (typeof nroCuota === 'number') {
      //     const fecha =
      //       sheet[
      //         XLSX.utils.encode_cell({
      //           r: rowIndex,
      //           c: sheetData.fecha.index.colIndex,
      //         })
      //       ]?.v
      //     const saldo =
      //       sheet[
      //         XLSX.utils.encode_cell({
      //           r: rowIndex,
      //           c: sheetData.saldo.index.colIndex,
      //         })
      //       ]?.v
      //     const intereses =
      //       sheet[
      //         XLSX.utils.encode_cell({
      //           r: rowIndex,
      //           c: sheetData.intereses.index.colIndex,
      //         })
      //       ]?.v
      //     const capital = sheet[
      //       XLSX.utils.encode_cell({
      //         r: rowIndex,
      //         c: sheetData.capital.index.colIndex,
      //       })
      //     ]?.v
      //       ? sheet[
      //           XLSX.utils.encode_cell({
      //             r: rowIndex,
      //             c: sheetData.capital.index.colIndex,
      //           })
      //         ].v
      //       : 0
      //     // const cuota = sheet[
      //     //   XLSX.utils.encode_cell({
      //     //     r: rowIndex,
      //     //     c: sheetData.cuota.index.colIndex,
      //     //   })
      //     // ]?.v
      //     //   ? sheet[
      //     //       XLSX.utils.encode_cell({
      //     //         r: rowIndex,
      //     //         c: sheetData.cuota.index.colIndex,
      //     //       })
      //     //     ].v
      //     //   : 0
      //     const cuota = intereses + capital

      //     const rowData: queryData = {
      //       tipo,
      //       nroCuota,
      //       fecha,
      //       cuota,
      //       capital,
      //       intereses,
      //       saldo,
      //     }
      //     data = [...data, rowData]
      //   }
      // }
      if (data[0].nroCuota === 0 && data[1].nroCuota === 0) {
        data.shift()
      }
      return data
    } catch (error) {
      alert(error)
      return []
    }
  }

  const createSheetQueries = (queryData: queryData[]) => {
    let result: string = ''
    queryData.forEach((item) => {
      if (item.intereses !== 0 || item.capital !== 0) {
        result += unityInsertQuery(operationNumber, item)
      }
    })
    return result
  }

  const createInsertQueries = (sheetList: sheetProps[]) => {
    let result: string = `${
      deleteOperation
        ? `delete from PAYMENTS_PLAN_SFCO where operacion = ${operationNumber}\n`
        : ''
    }--------OP ${operationNumber}--------\n`
    const selectedSheets = sheetList.filter((sheet) => sheet.checked)
    for (const sheet of selectedSheets) {
      const sheetData = webpcfReferences.map((item) => {
        const amortizacion = item.amortizacion.filter(
          (e) => e.sheetName === sheet.name
        )
        const intereses = item.intereses.filter(
          (e) => e.sheetName === sheet.name
        )

        let sumAmortizacion = 0
        amortizacion.forEach((item) => (sumAmortizacion += item.value))
        let sumIntereses = 0
        intereses.forEach((item) => (sumIntereses += item.value))

        return {
          fecha: item.date,
          nroCuota: item.paymentNumber,
          capital: sumAmortizacion,
          intereses: sumIntereses,
          tipo: sheet.type,
          saldo: item.saldoInsoluto,
        }
      })
      result += `---${sheet.name}---\n`
      result += createSheetQueries(sheetData)
    }
    setInsertQueries(result)
    var nanCounter = (result.match(/NaN/g) || []).length
    setNanQuantity(nanCounter)
  }

  const getData = async (file: File) => {
    setLoading(true)
    try {
      const workbook = await readFile(file)
      const operationNumber = getCellValueFromWorkbook(
        workbook,
        WEBPCF,
        cellOperationNumber
      )
      if (typeof operationNumber !== 'number') {
        throw new Error('Número de operación no encontrado')
      } else {
        setOperationNumber(operationNumber)
      }

      const formulasListAmortizacion = getColumnFormulasFromWebpcf(
        workbook,
        AmortizacionFirstCellLocation
      )
      const formulasListIntereses = getColumnFormulasFromWebpcf(
        workbook,
        InteresesFirstCellLocation
      )
      let sheetsInAmortizacionFormulas: string[] = []
      formulasListAmortizacion.forEach(
        (formula) =>
          (sheetsInAmortizacionFormulas = [
            ...sheetsInAmortizacionFormulas,
            ...extractSheetNamesFromFormula(formula),
          ])
      )
      sheetsInAmortizacionFormulas = [...new Set(sheetsInAmortizacionFormulas)]
      let sheetsInInteresesFormulas: string[] = []
      formulasListIntereses.forEach(
        (formula) =>
          (sheetsInInteresesFormulas = [
            ...sheetsInInteresesFormulas,
            ...extractSheetNamesFromFormula(formula),
          ])
      )
      sheetsInInteresesFormulas = [...new Set(sheetsInInteresesFormulas)]
      setAmortizacionFunctionList(sheetsInAmortizacionFormulas)
      setInteresesFunctionList(sheetsInInteresesFormulas)
      if (
        sheetsInAmortizacionFormulas.length > 0 ||
        sheetsInInteresesFormulas.length > 0
      ) {
        const sheetsInFormulas = [
          ...new Set([
            ...sheetsInAmortizacionFormulas,
            ...sheetsInInteresesFormulas,
          ]),
        ]
        setWebpfcFunctionsList(sheetsInFormulas)
      } else {
        throw new Error('Ninguna fórmula encontrada')
      }

      const references = getWebpcfReferences(
        workbook,
        AmortizacionFirstCellLocation
      )
      if (references.length > 0) {
        setWebpcfReferences(references)
        const sheetProps = getSheetsProps(workbook, references)
        const newSheetsList = sheetProps.map((sheetProp, index) => {
          return {
            name: sheetProp.name,
            index,
            checked: sheetProp.checked,
            paymentsQuantity: sheetProp.paymentsQuantity,
            type: sheetProp.type,
            amortizacionInUse: sheetProp.amortizacionInUse,
            interesesInUse: sheetProp.interesesInUse,
            updateSheetChecked,
            updateSheetType,
          }
        })
        setSheetsList(newSheetsList)
      }
    } catch (error) {
      setWebpfcFunctionsList([])
      setSheetsList([])
      setOperationNumber(0)
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
  return (
    <>
      <div className="grid grid-cols-2 gap-4 items-center text-left">
        <h1 className="font-bold">{file.name}</h1>
        <Button disabled={file === null} onClick={() => getData(file)}>
          {loading ? <LoadingSpinner /> : 'Cargar data'}
        </Button>
      </div>

      {dataLoaded && (
        <>
          <p className="text-left">Hojas usadas en columna Amortización:</p>
          <p className="text-left">{amortizacionFunctionList.toString()}</p>
          <p className="text-left">Hojas usadas en columna Intereses:</p>
          <p className="text-left">{interesesFunctionList.toString()}</p>
          {webpfcFunctionsList.length > 0 ? (
            <>
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
                    amortizacionInUse={sheet.amortizacionInUse}
                    interesesInUse={sheet.interesesInUse}
                    updateSheetChecked={updateSheetChecked}
                    updateSheetType={updateSheetType}
                  />
                ))}
              <div className="text-left">
                <Checkbox
                  id="deleteOperation"
                  checked={deleteOperation}
                  onClick={() => {
                    setDeleteOperation((prev) => !prev)
                  }}
                />
                <Label htmlFor="deleteOperation">
                  Eliminar data de PAYMENTS_PLAN_SFCO
                </Label>
              </div>

              <Button
                disabled={checkIfSelectedSheetsMissType(sheetsList)}
                onClick={() => createInsertQueries(sheetsList)}
              >
                Crear queries
              </Button>
              {nanQuantity > 0 && (
                <p className="bold text-red-600">
                  Cantidad de NaN: {nanQuantity}
                </p>
              )}
              <Query content={insertQueries} />
            </>
          ) : (
            <h1 className="bold text-red-600">Ninguna fórmula encontrada</h1>
          )}
        </>
      )}
    </>
  )
}

export default PlanDePagoDetalles
