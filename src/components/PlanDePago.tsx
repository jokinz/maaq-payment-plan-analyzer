import { useEffect, useRef, useState } from 'react'

import '../App.css'

import * as XLSX from 'xlsx'

import { getDataQuery, paymentPlansBackupQuery, updateQuery } from '../Queries'
import {
  excelDateToFormattedDate,
  getAllSheetNames,
  getCellValue,
  getLastCellValue,
  getSheetData,
  readFile,
  validateData
} from '../Utils'

import FormField from '@/components/FormField'
import Query from '@/components/Query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Spreadsheet from 'react-spreadsheet'

import BackUp from './BackUp'
import Wrapper from './Wrapper'

type Countries = 'colombia' | 'chile'
type Currencies = 'peso' | 'usd'

function PlanDePago() {
  const [country, setCountry] = useState<Countries>('colombia')
  const [currency, setCurrency] = useState<Currencies>('peso')

  // const cellOperationNumber: string = country === 'colombia' ? 'C4' : 'C1'
  // const cellTotalCredit: string = country === 'colombia' ? 'H8' : 'H5'
  const [cellOperationNumber, setCellOperationNumber] = useState<string>('C4')
  const [cellTotalCredit, setCellTotalCredit] = useState<string>('H8')
  const [updatingCellOperationNumber, setUpdatingCellOperationNumber] =
    useState<boolean>(false)
  const [updatingCellTotalCredit, setUpdatingCellTotalCredit] =
    useState<boolean>(false)
  const paymentNumberColumn = 'B'
  const WEBPCF: string = 'WEBPCF'

  const [externalOperationNumber, setExternalOperationNumber] =
    useState<number>(0)
  const [externalTotalCredit, setExternalTotalCredit] = useState<number>(0)
  const [externalPaymentsQuantity, setExternalPaymentsQuantity] =
    useState<number>(0)

  const [file, setFile] = useState<FileList | null>(null)

  const [targetSheet, setTargetSheet] = useState<string | null>(null)
  const [sheetsList, setSheetsList] = useState<string[]>([])

  const [fileOperationNumber, setFileOperationNumber] = useState<number>(0)
  const [fileTotalCredit, setFileTotalCredit] = useState<number>(0)
  const [filePaymentsQuantity, setFilePaymentsQuantity] = useState<number>(0)

  const query1: string = externalOperationNumber
    ? getDataQuery(externalOperationNumber)
    : ''
  const [query2, setQuery2] = useState<string>('')
  const query3: string = externalOperationNumber
    ? updateQuery(externalOperationNumber)
    : ''
  const fileRef = useRef<HTMLInputElement>(null)

  const [fileSheetData, setFileSheetData] = useState<any[] | null>(null)

  useEffect(() => {
    if (file && file.length > 0) {
      ;(async () => {
        const sheetNames = await getAllSheetNames(file[0])
        setSheetsList(sheetNames)
        if (sheetNames.includes(WEBPCF)) {
          setTargetSheet(WEBPCF)
          const sheetData = await getSheetData(file[0], WEBPCF)
          sheetData && setFileSheetData(sheetData)
        } else {
          setTargetSheet(sheetNames[0])
          const sheetData = await getSheetData(file[0], sheetNames[0])
          sheetData && setFileSheetData(sheetData)
        }
      })()
    } else {
      setSheetsList([])
      setTargetSheet(null)
      setFileSheetData(null)
    }
  }, [file])

  useEffect(() => {
    if (file && file.length > 0) {
      ;(async () => {
        if (targetSheet) {
          const sheetData = await getSheetData(file[0], targetSheet)
          sheetData && setFileSheetData(sheetData)
        }
      })()
    }
  }, [targetSheet])

  
  const createUpdateQueries = async (
    file: File,
    sheetName: string,
    columnName: string
  ): Promise<any> => {
    try {
      const workbook = await readFile(file)
      const sheet = workbook.Sheets[sheetName]
      const operationNumber = sheet[cellOperationNumber]?.v

      const columnRange = XLSX.utils.decode_range(sheet['!ref'] as string)
      const colIndex = XLSX.utils.decode_col(columnName)

      let concatenatedQueries = `use SCA_HIPOTEC\nGO\n`

      for (
        let rowIndex = columnRange.s.r;
        rowIndex <= columnRange.e.r;
        rowIndex++
      ) {
        const cellAddress = { r: rowIndex, c: colIndex }
        const cellRef = XLSX.utils.encode_cell(cellAddress)
        const numCuota = sheet[cellRef]?.v

        if (numCuota !== undefined && typeof numCuota === 'number') {
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
            E10: amortizacion,
            F10: intereses,
            C10: fechVenc,
            G10: seguros,
            D10: cuota,
            H10: saldoInsoluto,
            F6: 0,
            C4: operationNumber,
            B10: numCuota,
          }

          function createUpdateQueryLine(rowData: any) {
            const fld_col_amor = Math.trunc(Math.round(rowData.E10))
            const fld_col_int = Math.trunc(Math.round(rowData.F10))
            const fld_col_fven = excelDateToFormattedDate(rowData.C10)
            const fld_col_segu = Math.trunc(Math.round(rowData.G10))
            const fld_col_cuo = Math.trunc(Math.round(rowData.D10))
            const fld_col_cuos = Math.trunc(
              Math.round(rowData.D10 - rowData.G10)
            )

            let fld_col_salc =
              rowData.D10 > 0
                ? Math.trunc(Math.round(rowData.D10))
                : rowData.H10

            const fld_col_sal = Math.trunc(Math.round(rowData.H10))

            const query = `Update col set fld_col_amor = ${fld_col_amor} , fld_col_int = ${fld_col_int} , fld_col_fven = '${fld_col_fven}' , fld_col_segu = ${fld_col_segu} , fld_col_cuo = ${fld_col_cuo} , fld_col_cuos = ${fld_col_cuos} , fld_col_salc = case when fld_col_salc > 0 then ${fld_col_salc} else fld_col_salc end , fld_col_sal = ${fld_col_sal} where fld_col_oper = ${rowData.C4} and fld_col_ncu = ${rowData.B10}`

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

  const validate = async () => {
    if (file && file.length > 0 && targetSheet) {
      try {
        const operationNumber = await getCellValue(
          file[0],
          targetSheet,
          cellOperationNumber
        )
        typeof operationNumber === 'number' &&
          setFileOperationNumber(operationNumber)
        const totalCredit = await getCellValue(
          file[0],
          targetSheet,
          cellTotalCredit
        )
        typeof totalCredit === 'number' &&
          setFileTotalCredit(Math.trunc(totalCredit))
        const readPaymentsQuantity = await getLastCellValue(
          file[0],
          targetSheet,
          paymentNumberColumn
        )
        typeof readPaymentsQuantity === 'number' &&
          setFilePaymentsQuantity(readPaymentsQuantity)
      } catch (error) {
        alert('Error reading file:' + error)
      }
    }
  }

  const restartValues = () => {
    setCountry('colombia')
    setCurrency('peso')
    setCellOperationNumber('C4')
    setUpdatingCellOperationNumber(false)
    setCellTotalCredit('H8')
    setUpdatingCellTotalCredit(false)
    setExternalOperationNumber(0)
    setExternalTotalCredit(0)
    setExternalPaymentsQuantity(0)
    setFile(null)
    setFileOperationNumber(0)
    setFileTotalCredit(0)
    setFilePaymentsQuantity(0)
    setTargetSheet(null)
    setFileSheetData(null)
    setQuery2('')
    if (fileRef.current) {
      fileRef.current.value = ''
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <Wrapper>
      <h2 className="font-bold">Aplicación de plan de pago</h2>

      <BackUp query={paymentPlansBackupQuery(new Date())} />
      <section className="grid grid-cols-2 gap-8 items-center">
        <div>
          <p>País: </p>
          <RadioGroup defaultValue="colombia">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="colombia"
                id="colombia"
                checked={country === 'colombia'}
                onChange={() => setCountry('colombia')}
              />
              <Label htmlFor="colombia">Colombia</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="chile"
                id="chile"
                checked={country === 'chile'}
                onChange={() => setCountry('chile')}
                disabled
              />
              <Label htmlFor="chile">Chile</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center text-left">
          <FormField
            htmlFor="cellOperationNumber"
            label="Celda número de operación"
            value={cellOperationNumber}
            disabled={!updatingCellOperationNumber}
            onChange={(event) => setCellOperationNumber(event.target.value)}
          />
          <Button onClick={() => setUpdatingCellOperationNumber(true)}>
            Cambiar
          </Button>
          <FormField
            htmlFor="cellTotalCredit"
            label="Celda crédito total"
            value={cellTotalCredit}
            disabled={!updatingCellTotalCredit}
            onChange={(event) => setCellTotalCredit(event.target.value)}
          />
          <Button onClick={() => setUpdatingCellTotalCredit(true)}>
            Cambiar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <FormField
            htmlFor="operationNumber"
            label="Número de Operación"
            value={externalOperationNumber ? externalOperationNumber : ''}
            onChange={(event) =>
              parseInt(event.target.value) &&
              setExternalOperationNumber(parseInt(event.target.value))
            }
          />
        </div>
        <Query content={query1} />
        <div className="grid grid-cols-2 gap-4 text-left items-center">
          <h3 className="font-bold col-span-2 text-center">Datos de entrada</h3>
          <FormField
            htmlFor="operationNumberCopy"
            label="Número de Operación"
            value={externalOperationNumber ? externalOperationNumber : ''}
            readOnly
          />
          <FormField
            htmlFor="externalPaymentsQuantity"
            label="Cantidad de cuotas"
            value={
              externalPaymentsQuantity !== 0 ? externalPaymentsQuantity : ''
            }
            onChange={(event) =>
              parseInt(event.target.value) &&
              setExternalPaymentsQuantity(parseInt(event.target.value))
            }
          />
          <FormField
            htmlFor="totalCredit"
            label="Crédito Total"
            value={externalTotalCredit !== 0 ? externalTotalCredit : ''}
            onChange={(event) =>
              parseInt(event.target.value) &&
              setExternalTotalCredit(parseInt(event.target.value))
            }
          />
          <div className="grid grid-cols-4 col-span-2 items-center gap-4">
            <Label htmlFor="externalFile">Archivo: </Label>
            <Input
              id="externalFile"
              ref={fileRef}
              type="file"
              accept=".xls, .xlsm, .xlsx"
              onChange={(event) => setFile(event.currentTarget.files)}
            />
            {file && file.length > 0 && targetSheet && (
              <>
                <Label htmlFor="selectedSheet">Hoja:</Label>
                <Select
                  value={targetSheet}
                  onValueChange={(sheet: string) => setTargetSheet(sheet)}
                  name="selectedSheet"
                  disabled={file && file.length > 0 === null}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hoja" />
                  </SelectTrigger>
                  <SelectContent>
                    {sheetsList.map((sheetName, index) => {
                      return (
                        <SelectItem key={index} value={sheetName}>
                          {sheetName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <Button
            className="col-span-2"
            disabled={
              externalOperationNumber === 0 ||
              externalPaymentsQuantity === 0 ||
              externalTotalCredit === 0 ||
              file === null
            }
            onClick={(event) => {
              event.preventDefault()
              validate()
            }}
          >
            Validar
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-left items-center">
          <h3 className="font-bold col-span-2 text-center">
            Datos del archivo
          </h3>
          <FormField
            htmlFor="fileOperationNumber"
            label="Número de Operación"
            labelBoldNote="(Archivo)"
            value={fileOperationNumber ? fileOperationNumber : ''}
            readOnly
            style={
              fileOperationNumber === externalOperationNumber
                ? { color: 'green' }
                : { color: 'red' }
            }
          />
          <FormField
            htmlFor="filePaymentsQuantity"
            label="Cantidad de cuotas"
            value={filePaymentsQuantity ? filePaymentsQuantity : ''}
            labelBoldNote="(Archivo)"
            readOnly
            style={
              filePaymentsQuantity === externalPaymentsQuantity
                ? { color: 'green' }
                : { color: 'red' }
            }
          />
          <FormField
            htmlFor="fileTotalCredit"
            label="Crédito Total"
            value={fileTotalCredit ? fileTotalCredit : ''}
            labelBoldNote="(Archivo)"
            readOnly
            style={{
              color:
                fileTotalCredit - externalTotalCredit === 0
                  ? 'green'
                  : fileTotalCredit - externalTotalCredit <= 100 &&
                    fileTotalCredit - externalTotalCredit >= -100
                  ? 'orange'
                  : 'red',
            }}
          />
          <FormField
            htmlFor="totalCreditDifference"
            label="Diferencia de crédito"
            value={fileTotalCredit ? fileTotalCredit - externalTotalCredit : ''}
            readOnly
            style={{
              color:
                fileTotalCredit - externalTotalCredit === 0
                  ? 'green'
                  : fileTotalCredit - externalTotalCredit <= 100 &&
                    fileTotalCredit - externalTotalCredit >= -100
                  ? 'orange'
                  : 'red',
            }}
          />

          <Button
            className="col-span-2"
            disabled={
              !file ||
              fileOperationNumber !== externalOperationNumber ||
              fileTotalCredit - externalTotalCredit >= 100 ||
              fileTotalCredit - externalTotalCredit <= -100 ||
              filePaymentsQuantity !== externalPaymentsQuantity
            }
            onClick={(event) => {
              event.preventDefault()
              try {
                file &&
                  targetSheet &&
                  validateData(file[0], targetSheet, paymentNumberColumn)
              } catch (error) {
                alert(error)
              }
            }}
          >
            Validar datos
          </Button>
        </div>
        <div>
          <p>Moneda: </p>
          <RadioGroup defaultValue="peso">
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="peso"
                id="peso"
                checked={currency === 'peso'}
                onChange={() => setCurrency('peso')}
              />
              <Label htmlFor="peso">Peso</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="usd"
                id="usd"
                checked={currency === 'usd'}
                onChange={() => setCurrency('usd')}
                disabled
              />
              <Label htmlFor="usd">USD</Label>
            </div>
          </RadioGroup>
        </div>
        <Button
          disabled={
            fileOperationNumber !== externalOperationNumber ||
            fileTotalCredit - externalTotalCredit >= 100 ||
            fileTotalCredit - externalTotalCredit <= -100 ||
            filePaymentsQuantity !== externalPaymentsQuantity ||
            file === null
          }
          onClick={async (event) => {
            event.preventDefault()
            try {
              if (file && targetSheet) {
                const updateQueries = await createUpdateQueries(
                  file[0],
                  targetSheet,
                  paymentNumberColumn
                )
                setQuery2(updateQueries)
              }
            } catch (error) {
              alert(error)
            }
          }}
        >
          Crear Update Queries
        </Button>
        {fileSheetData && (
          <div className="overflow-scroll max-h-96 col-span-2">
            <Spreadsheet data={fileSheetData} />
          </div>
        )}
        <h3 className="col-span-2 font-bold">Update queries: </h3>
        <Query content={query2}></Query>
        <Query content={query3}></Query>
      </section>
      <Button
        className="fixed right-4 bottom-4"
        onClick={() => restartValues()}
      >
        Reiniciar <FontAwesomeIcon className="ml-2" icon={faArrowRotateLeft} />
      </Button>
    </Wrapper>
  )
}

export default PlanDePago
