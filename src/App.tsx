import { useRef, useState } from 'react'
import './App.css'

import * as XLSX from 'xlsx'
import { excelDateToFormattedDate } from './Utils'
import { getDataQuery, updateQuery } from './Queries'
import Query from './components/Query'

type Countries = 'colombia' | 'chile'
type Currencies = 'peso' | 'usd'

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
      <p>Country: </p>

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
        External Operation Number:{' '}
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
        <button
          disabled={query1 === ''}
          onClick={(event) => {
            event.preventDefault()
            navigator.clipboard.writeText(query1)
          }}
        >
          Copy Query N°1
        </button>
      </p>
      <p>
        External Total Credit:{' '}
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
        External Payments Quantity:{' '}
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
        Validate
      </button>

      {file && (
        <>
          <p
            style={
              fileOperationNumber === externalOperationNumber
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            File Operation Number: <b>{fileOperationNumber}</b>
          </p>
          <p
            style={
              fileTotalCredit - externalTotalCredit <= 100 &&
              fileTotalCredit - externalTotalCredit >= -100
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            File Total Credit: <b>{fileTotalCredit}</b>
          </p>
          <p
            style={
              fileTotalCredit - externalTotalCredit <= 100 &&
              fileTotalCredit - externalTotalCredit >= -100
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            Total Credit Difference:{' '}
            <b>{fileTotalCredit - externalTotalCredit}</b>
          </p>
          <p
            style={
              filePaymentsQuantity === externalPaymentsQuantity
                ? { color: 'green' }
                : { color: 'red' }
            }
          >
            File Payments Quantity: <b>{filePaymentsQuantity}</b>
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
          Validate data
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
      <p>Update queries:</p>
      <textarea disabled value={query2} className="textarea-query"></textarea>
      <Query content={query2}></Query>
      <p>
        <button
          disabled={query2 === ''}
          onClick={(event) => {
            event.preventDefault()
            navigator.clipboard.writeText(query2)
          }}
        >
          Copy Query N°2
        </button>
      </p>
      <Query content={query3}></Query>
      <p>
        <button
          disabled={query3 === ''}
          onClick={(event) => {
            event.preventDefault()
            navigator.clipboard.writeText(query3)
          }}
        >
          Copy Query N°3
        </button>
      </p>
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
