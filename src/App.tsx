import { useRef, useState } from 'react'
import './App.css'

import * as XLSX from 'xlsx'
import { excelDateToFormattedDate } from './Utils'
import { getDataQuery, updateQuery } from './Queries'
import Query from './components/Query'

type Countries = 'colombia' | 'chile'
type Currencies = 'peso' | 'usd'
type Status = {
  value: number
  text: string
}
const StatusList: Status[] = [
  { value: 0, text: 'VIGENTE' },
  { value: 1, text: 'CANCELADA' },
  { value: 10, text: 'CANCELADO SINESTRADO' },
  { value: 11, text: 'DEVOLUCION VOLUNTARIA' },
  { value: 12, text: 'CANCELADO PREPAGO' },
  { value: 2, text: 'EXTINGUIDA' },
  { value: 3, text: 'CASTIGO NO RECUPERADO' },
  { value: 4, text: 'VENCIDAS INCONSISTENTES' },
  { value: 5, text: 'CANCELADO MODIFICADO' },
  { value: 6, text: 'CANCELADO - REPROGRAMADO' },
  { value: 7, text: 'ANULADO' },
  { value: 8, text: 'INCOBRABLE' },
  { value: 9, text: 'CANCELADO NOVADO' },
]

function App() {
  const [country, setCountry] = useState<Countries>('colombia')
  const [currency, setCurrency] = useState<Currencies>('peso')

  const sheetName: string = 'WEBPCF'
  const cellOperationNumber: string = country === 'colombia' ? 'C4' : 'C1'
  const cellTotalCredit: string = country === 'colombia' ? 'H8' : 'H5'
  const paymentNumberColumn = 'B'

  // TODO: check if SFL is correct
  const targetDatabase = country === 'colombia' ? 'BT_SFCO' : 'SFL'

  const [externalOperationNumber, setExternalOperationNumber] =
    useState<number>(0)
  const [externalTotalCredit, setExternalTotalCredit] = useState<number>(0)
  const [externalPaymentsQuantity, setExternalPaymentsQuantity] =
    useState<number>(0)

  const [file, setFile] = useState<FileList | null>(null)

  const [fileOperationNumber, setFileOperationNumber] = useState<number>(0)
  const [fileTotalCredit, setFileTotalCredit] = useState<number>(0)
  const [filePaymentsQuantity, setFilePaymentsQuantity] = useState<number>(0)

  const query1: string = externalOperationNumber
    ? getDataQuery(targetDatabase, externalOperationNumber)
    : ''
  const [query2, setQuery2] = useState<string>('')
  const query3: string = externalOperationNumber
    ? updateQuery(externalOperationNumber)
    : ''

  const [sourceOperation, setSourceOperation] = useState(0)
  const [targetOperation, setTargetOperation] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState<number>(-1)
  function readCellValue(
    file: File,
    sheetName: string,
    cellReference: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = event.target?.result
          if (typeof data === 'string' || data instanceof ArrayBuffer) {
            const workbook = XLSX.read(data, { type: 'array' })
            const sheet = workbook.Sheets[sheetName]
            const cellValue = sheet[cellReference]?.v

            resolve(cellValue)
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

  function getLastCellValue(
    file: File,
    sheetName: string,
    columnName: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = event.target?.result
          if (typeof data === 'string' || data instanceof ArrayBuffer) {
            const workbook = XLSX.read(data, { type: 'array' })

            const sheet = workbook.Sheets[sheetName]

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

            resolve(lastCellValue)
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

  function validateData(
    file: File,
    sheetName: string,
    columnName: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = event.target?.result
          if (typeof data === 'string' || data instanceof ArrayBuffer) {
            const workbook = XLSX.read(data, { type: 'array' })

            const sheet = workbook.Sheets[sheetName]

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
              const numCuota = sheet[cellRef]?.v

              if (numCuota !== undefined && typeof numCuota === 'number') {
                const siguienteNumCuota =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex })
                  ]?.v
                const fechVenc =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 1 })
                  ]?.v
                const siguienteFechVenc =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 1 })
                  ]?.v
                const cuota =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })
                  ]?.v
                const amortizacion =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })
                  ]?.v
                const siguienteAmortizacion =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 3 })
                  ]?.v
                const intereses =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })
                  ]?.v
                const seguros =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 5 })
                  ]?.v
                const saldoInsoluto =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })
                  ]?.v
                const siguienteSaldoInsoluto =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex + 6 })
                  ]?.v

                if (
                  seguros + intereses + amortizacion - cuota !== 0 ||
                  saldoInsoluto -
                    siguienteAmortizacion -
                    siguienteSaldoInsoluto !==
                    0 ||
                  siguienteNumCuota - numCuota !== 1 ||
                  siguienteFechVenc - fechVenc < 28 ||
                  siguienteFechVenc - fechVenc > 31
                ) {
                  alert(`Error de validación en cuota N°: ${numCuota}`)
                }
              }
            }

            resolve(lastCellValue)
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

  function createUpdateQueries(
    file: File,
    sheetName: string,
    columnName: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        try {
          const data = event.target?.result
          if (typeof data === 'string' || data instanceof ArrayBuffer) {
            const workbook = XLSX.read(data, { type: 'array' })

            const sheet = workbook.Sheets[sheetName]
            const operationNumber = sheet['C4']?.v

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
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 1 })
                  ]?.v
                const cuota =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 2 })
                  ]?.v
                const amortizacion =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 3 })
                  ]?.v
                const intereses =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 4 })
                  ]?.v
                const seguros =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 5 })
                  ]?.v
                const saldoInsoluto =
                  sheet[
                    XLSX.utils.encode_cell({ r: rowIndex, c: colIndex + 6 })
                  ]?.v

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

            resolve(concatenatedQueries)
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

  const validate = async () => {
    if (file) {
      try {
        const readOperationNumber = await readCellValue(
          file[0],
          sheetName,
          cellOperationNumber
        )
        setFileOperationNumber(readOperationNumber)
        const readTotalCredit = await readCellValue(
          file[0],
          sheetName,
          cellTotalCredit
        )
        setFileTotalCredit(readTotalCredit)
        const readPaymentsQuantity = await getLastCellValue(
          file[0],
          sheetName,
          paymentNumberColumn
        )
        setFilePaymentsQuantity(readPaymentsQuantity)
      } catch (error) {
        console.error('Error reading file:', error)
      }
    }
  }
  const fileRef = useRef<HTMLInputElement>(null)

  const restartValues = () => {
    setCountry('colombia')
    setCurrency('peso')
    setExternalOperationNumber(0)
    setExternalTotalCredit(0)
    setExternalPaymentsQuantity(0)
    setFile(null)
    setFileOperationNumber(0)
    setFileTotalCredit(0)
    setFilePaymentsQuantity(0)
    setQuery2('')
    if (fileRef.current) {
      fileRef.current.value = ''
    }
  }
  return (
    <>
      <h2>Aplicación de plan de pago</h2>
      <p>País: </p>
      <div>
        <div>
          <input
            type="radio"
            id="colombia"
            value="colombia"
            checked={country === 'colombia'}
            onChange={() => setCountry('colombia')}
          />
          <label htmlFor="colombia">Colombia</label>
        </div>

        <div>
          <input
            disabled
            type="radio"
            id="chile"
            value="chile"
            checked={country === 'chile'}
            onChange={() => setCountry('chile')}
          />
          <label htmlFor="chile">Chile</label>
        </div>
      </div>
      <p>
        Número de Operación:
        <input
          type="text"
          value={externalOperationNumber ? externalOperationNumber : ''}
          onChange={(event) =>
            parseInt(event.target.value) &&
            setExternalOperationNumber(parseInt(event.target.value))
          }
        />
      </p>
      <Query content={query1}></Query>
      <p>
        Crédito Total:
        <input
          type="text"
          value={externalTotalCredit !== 0 ? externalTotalCredit : ''}
          onChange={(event) =>
            parseInt(event.target.value) &&
            setExternalTotalCredit(parseInt(event.target.value))
          }
        />
      </p>
      <p>
        Cantidad de pagos:{' '}
        <input
          type="text"
          value={externalPaymentsQuantity !== 0 ? externalPaymentsQuantity : ''}
          onChange={(event) =>
            parseInt(event.target.value) &&
            setExternalPaymentsQuantity(parseInt(event.target.value))
          }
        />
      </p>
      <input
        ref={fileRef}
        type="file"
        onChange={(event) => setFile(event.currentTarget.files)}
      />
      <button
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
      </button>
      <h3>Datos del archivo</h3>
      {file && (
        <>
          <p
            style={
              fileOperationNumber === externalOperationNumber
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            Número de Operación: <b>{fileOperationNumber}</b>
          </p>
          <p
            style={{
              color:
                fileTotalCredit - externalTotalCredit === 0
                  ? 'green'
                  : fileTotalCredit - externalTotalCredit <= 100 &&
                    fileTotalCredit - externalTotalCredit >= -100
                  ? 'yellow'
                  : 'red',
            }}
          >
            Crédito Total: <b>{fileTotalCredit}</b>
          </p>
          <p
            style={{
              color:
                fileTotalCredit - externalTotalCredit === 0
                  ? 'green'
                  : fileTotalCredit - externalTotalCredit <= 100 &&
                    fileTotalCredit - externalTotalCredit >= -100
                  ? 'yellow'
                  : 'red',
            }}
          >
            Diferencia de crédito:
            <b>{fileTotalCredit - externalTotalCredit}</b>
          </p>
          <p
            style={
              filePaymentsQuantity === externalPaymentsQuantity
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            Cantidad de cuotas: <b>{filePaymentsQuantity}</b>
          </p>
        </>
      )}
      <p>
        <button
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
              file && validateData(file[0], sheetName, paymentNumberColumn)
            } catch (error) {
              console.error(error)
            }
          }}
        >
          Validar datos
        </button>
      </p>
      <div>
        <div>
          <input
            type="radio"
            id="peso"
            value="peso"
            checked={currency === 'peso'}
            onChange={() => setCurrency('peso')}
          />
          <label htmlFor="peso">Peso</label>
        </div>

        <div>
          <input
            disabled
            type="radio"
            id="usd"
            value="usd"
            checked={currency === 'usd'}
            onChange={() => setCurrency('usd')}
          />
          <label htmlFor="usd">USD</label>
        </div>
      </div>
      <p>
        <button
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
              if (file) {
                const updateQueries = await createUpdateQueries(
                  file[0],
                  sheetName,
                  paymentNumberColumn
                )
                setQuery2(updateQueries)
              }
            } catch (error) {
              console.error(error)
            }
          }}
        >
          Create Update Queries
        </button>
      </p>
      <p>Update queries: </p>
      <Query content={query2}></Query>
      <Query content={query3}></Query>
      <h2>Traspaso de bienes y baja</h2>

      <p>
        <label htmlFor="targetOperation">Operación Objetivo: </label>
        <input
          id="targetOperation"
          value={targetOperation}
          onChange={(event) => {
            event.preventDefault()
            setTargetOperation(parseInt(event.target.value))
          }}
        />
      </p>
      <p>
        <label htmlFor="sourceOperation">Operation Fuente: </label>
        <input
          id="sourceOperation"
          value={sourceOperation}
          onChange={(event) => {
            event.preventDefault()
            setSourceOperation(parseInt(event.target.value))
          }}
        />
      </p>
      <Query
        content={
          targetOperation
            ? `SELECT * FROM SCA_ADMINI..GAR WHERE FLD_GAR_OPER = ${targetOperation}`
            : ''
        }
      ></Query>
      <Query
        content={
          targetOperation
            ? `DELETE FROM SCA_ADMINI..GAR WHERE FLD_GAR_OPER = ${targetOperation}`
            : ''
        }
      ></Query>
      <Query
        content={
          targetOperation && sourceOperation
            ? `INSERT INTO SCA_ADMINI..GAR
       SELECT ${targetOperation} , FLD_GAR_NCHASIS,FLD_GAR_NMOT,FLD_GAR_MODB,FLD_GAR_TIPB,FLD_GAR_ESTB,FLD_GAR_PRD,FLD_GAR_SUC,FLD_GAR_MON
,FLD_GAR_ACO,FLD_GAR_CAL,FLD_GAR_CIU,FLD_GAR_COM,FLD_GAR_REG,FLD_GAR_FTAS,FLD_GAR_HIP,FLD_GAR_IBRA,FLD_GAR_IBRF,FLD_GAR_IBRN
,FLD_GAR_NBO,FLD_GAR_NOT,FLD_GAR_NUE,FLD_GAR_ROLC1,FLD_GAR_ROLC2,FLD_GAR_SUCC,FLD_GAR_SUT,FLD_GAR_TGAR,FLD_GAR_TIB,FLD_GAR_VAT
,FLD_GAR_VCO,FLD_GAR_VSIM,FLD_GAR_TIPO,FLD_GAR_MVEH,FLD_GAR_MODV, FLD_GAR_FEJE,FLD_GAR_TBI,FLD_GAR_TIC,FLD_GAR_DES
,FLD_GAR_IBRC,FLD_GAR_TBIEN,FLD_GAR_MODELO,FLD_GAR_FIBR,FLD_GAR_BLOC,FLD_GAR_DEPTO,FLD_GAR_CBR,FLD_GAR_IBRA2,FLD_GAR_DIRN
,FLD_GAR_CPOS,FLD_GAR_VMKD,FLD_GAR_POLI,FLD_GAR_MONB,FLD_GAR_FDEP,FLD_GAR_TCOMB,FLD_GAR_EASEG,FLD_GAR_NUMFAC,FLD_GAR_FEMFAC,FLD_GAR_MTOFAC
       ,FLD_GAR_OTGR,FLD_GAR_BENL,FLD_GAR_ITEM 
       FROM SCA_ADMINI..GAR INNER JOIN SCA_ADMINI..TCO ON FLD_GAR_OPER = FLD_TCO_OPER
       WHERE FLD_GAR_OPER IN(${sourceOperation})
--     AND LTRIM(RTRIM(FLD_GAR_BLOC)) NOT IN('RHDP79')
       ORDER BY  FLD_GAR_BLOC
`
            : ''
        }
      ></Query>

      {sourceOperation !== 0 && (
        <>
          <label htmlFor="selectedStatus">Status: </label>
          <select
            defaultValue={-1}
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(parseInt(event.target.value))
            }
            name="selectedStatus"
            id="selectedStatus"
          >
            <option disabled value={-1}>
              Select status
            </option>
            {StatusList.map((status) => {
              return <option value={status.value}>{status.text}</option>
            })}
          </select>
          {selectedStatus !== -1 && (
            <Query
              content={`UPDATE SCA_ADMINI..TCO 
       SET FLD_TCO_EOPE = '${selectedStatus}'
       WHERE  FLD_TCO_OPER IN(${sourceOperation}) --1`}
            ></Query>
          )}
        </>
      )}

      <button
        style={{ position: 'fixed', right: '2rem', bottom: '2rem' }}
        onClick={() => restartValues()}
      >
        Restart
      </button>
    </>
  )
}

export default App
