import { useEffect, useRef, useState } from 'react'

import * as XLSX from 'xlsx'

import { unityInsertQuery } from '@/Queries'
import { getAllSheetsProps, getCellValue, readFile } from '@/Utils'

import Wrapper from '@/components/Wrapper'
import Query from './Query'
import Sheet, { sheetProps } from './Sheet'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

// TODO: update types and move type definition
export type queryData = {
  tipo: number
  nroCuota: number
  fecha: number
  cuota: number
  amortizacion: number
  intereses: number
  saldo: number
  seguros: number
}

// const targetSheetNames: 'vehiculo' | 'seguro vehiculo' | 'seguro de vida'

const targetDatabase: string = 'MQTools'
const webpcf: string = 'WEBPCF'
const cellOperationNumber: string = 'C4'

const PlanDePagoAdv = () => {
  const [operationNumber, setOperationNumber] = useState<number>(0)
  const [insertQueries, setInsertQueries] = useState<string>('')

  const [file, setFile] = useState<FileList | null>(null)

  const [sheetsList, setSheetsList] = useState<sheetProps[]>([])

  const fileRef = useRef<HTMLInputElement>(null)

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
          const cuota =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })]?.v
          const capital =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })]?.v
          const intereses =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })]?.v
          const seguros =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 5 })]?.v
          const saldo =
            sheet[XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })]?.v
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
            amortizacion: capital,
            intereses,
            saldo,
            seguros,
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

  const createInsertQueries = async (file: File, selectedSheets: string[]) => {
    let result: string = `use ${targetDatabase} \n`
    for (const sheet of selectedSheets) {
      const sheetData = await getSheetData(file, sheet)
      result += `---${sheet}---\n`
      result += createSheetQueries(sheetData)
    }
    setInsertQueries(result)
  }

  useEffect(() => {
    if (file) {
      ;(async () => {
        try {
          const sheetProps = await getAllSheetsProps(file[0])
          setSheetsList(sheetProps)
          const operationNumber = await getCellValue(
            file[0],
            webpcf,
            cellOperationNumber
          )
          setOperationNumber(operationNumber)
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
      {file && (
        <>
          {sheetsList.map((sheet, index) => (
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
        onClick={() =>
          file &&
          createInsertQueries(
            file[0],
            sheetsList
              .filter((sheet) => sheet.checked)
              .map((sheet) => sheet.name)
          )
        }
      >
        Crear queries
      </Button>
      <Query content={insertQueries} />
    </Wrapper>
  )
}

export default PlanDePagoAdv
