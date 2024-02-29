import { useState } from 'react'
import './App.css'

import * as XLSX from 'xlsx'

function App() {
  const [country, setCountry] = useState('colombia')
  const [currency, setCurrency] = useState('peso')

  const sheetName: string = 'WEBPCF'
  const cellOperationNumber: string = country === 'colombia' ? 'C4' : 'C1'
  const cellTotalCredit: string = country === 'colombia' ? 'H8' : 'H5'
  const paymentNumberColumn = 'B'

  // TODO: check if SFL is correct
  const targetDatabase = country === 'colombia' ? 'BT_SFCO' : 'SFL'

  const [file, setFile] = useState<FileList | null>()

  const [externalOperationNumber, setExternalOperationNumber] =
    useState<number>(0)
  const [externalTotalCredit, setExternalTotalCredit] = useState<number>(0)
  const [externalPaymentsQuantity, setExternalPaymentsQuantity] =
    useState<number>(0)

  const [fileOperationNumber, setFileOperationNumber] = useState<number>(0)
  const [fileTotalCredit, setFileTotalCredit] = useState<number>(0)
  const [filePaymentsQuantity, setFilePaymentsQuantity] = useState<number>(0)

  const query1 = `use ${targetDatabase}
  GO
  
  SELECT SUM(FLD_COL_AMOR), NUM_CUOTAS = COUNT(1) FROM
  SCA_HIPOTEC..COL 
  WHERE FLD_COL_OPER = ${externalOperationNumber} 

  SELECT * FROM SCA_ADMINI..TCO WHERE FLD_TCO_OPER =
  ${externalOperationNumber}`
  const [query2, setQuery2] = useState('')
  const query3 = `use sca_hipotec
  GO

  DECLARE @FLD_COL_OPER	INT
  ,		@FLD_FIN_FPDE	DATETIME
  ,		@num_liq		int

        SET @FLD_COL_OPER = ${externalOperationNumber}


        SELECT @FLD_FIN_FPDE = FLD_FIN_FPDE FROM SCA_HIPOTEC..FIN WHERE FLD_FIN_OPER = @FLD_COL_OPER 
        
        EXEC SCA_HIPOTEC..SVC_PRO_CONT2 @FLD_COL_OPER, 0, 0, '1', @FLD_FIN_FPDE, '', '', @num_liq Output

  UPDATE	SCA_HIPOTEC..SOL
    SET	FLD_SOL_ESOL	= '3',
      FLD_SOL_RES		= '3'
  WHERE	FLD_SOL_OPER	= @FLD_COL_OPER

  UPDATE SCA_HIPOTEC..FIN
    SET FLD_FIN_EST = '3'
  WHERE FLD_FIN_OPER = @FLD_COL_OPER

  UPDATE SCA_HIPOTEC..TRC 
  SET FLD_TRC_FPRO = '19900101'
  WHERE FLD_TRC_OPER = @FLD_COL_OPER AND
      FLD_TRC_NLIQ != @NUM_LIQ AND
      FLD_TRC_FPRO = 0 AND
      FLD_TRC_ASN IN ('SCA1','SCA26' /*OTORGAMIENTOS*/,'SCA5'/*REVERSA OTORGAMIENTO*/,'SCA33'/*OTORGAMIENTO DE RECUPERO*/)



  /*RESPALDA DATOS DE TABLA FIN Y COL EN BASE DE DATOS HISTORICO*/
  INSERT INTO SCA_HISTORICO..THIS_FIN
  (THIS_FIN_OPER, THIS_FIN_MOS, THIS_FIN_FOTO, THIS_FIN_FPDE, THIS_FIN_PLA, THIS_FIN_GNOT, THIS_FIN_MOT, THIS_FIN_INST, THIS_FIN_ICAP, THIS_FIN_MIMP, THIS_FIN_NLIQ)
  SELECT FLD_FIN_OPER, FLD_FIN_MOS, FLD_FIN_FOTO, FLD_FIN_FPDE, FLD_FIN_PLA, FLD_FIN_GNOT, FLD_FIN_MOT, FLD_FIN_INST, FLD_FIN_ICAP, FLD_FIN_MIMP, @num_liq
  FROM SCA_HIPOTEC..FIN
  WHERE FLD_FIN_OPER=@FLD_COL_OPER

  INSERT INTO SCA_HISTORICO..THIS_COL
  (THIS_COL_OPER, THIS_COL_FVEN, THIS_COL_AMOR, THIS_COL_NCU, THIS_COL_INT, THIS_COL_CUO, THIS_COL_ECLP, THIS_COL_NDOC, THIS_COL_SEGU, THIS_COL_NLIQ)
  SELECT FLD_COL_OPER, FLD_COL_FVEN, FLD_COL_AMOR, FLD_COL_NCU, FLD_COL_INT, FLD_COL_CUO , FLD_COL_ECLP, FLD_COL_NDOC, FLD_COL_SEGU, @num_liq
  FROM SCA_HIPOTEC..COL
  WHERE FLD_COL_OPER=@FLD_COL_OPER



  --- PARA LOS CASOS DE CUOTAS QUE ENTRAN VENCIDAS
  UPDATE SCA_ADMINI..TCO
  SET FLD_TCO_FPDI = (SELECT MIN(FLD_COL_FVEN) FROM SCA_HIPOTEC..COL WHERE FLD_COL_OPER = @FLD_COL_OPER )
  WHERE FLD_TCO_OPER = @FLD_COL_OPER`

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
                // console.log([
                //   seguros + intereses + amortizacion - cuota,
                //   saldoInsoluto -
                //     siguienteAmortizacion -
                //     siguienteSaldoInsoluto,
                //   siguienteNumCuota - numCuota,
                //   siguienteFechVenc - fechVenc,
                // ])
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

            let concatenatedQueries = `use ${targetDatabase}
            GO \n`

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

  const excelDateToFormattedDate = (excelSerialDate: number) => {
    const excelEpoch = new Date('1899-12-31T00:00:00.000Z')
    const excelDate = new Date(
      excelEpoch.getTime() + excelSerialDate * 24 * 60 * 60 * 1000
    )

    // Format the date in yyyymmdd format
    const year = excelDate.getFullYear()
    const month = (excelDate.getMonth() + 1).toString().padStart(2, '0') // Month is zero-based
    const day = excelDate.getDate().toString().padStart(2, '0')

    const formattedDate = `${year}${month}${day}`
    return formattedDate
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
          value={externalOperationNumber}
          onChange={(event) =>
            parseInt(event.target.value) &&
            setExternalOperationNumber(parseInt(event.target.value))
          }
        />
      </p>
      <textarea
        disabled
        value={externalOperationNumber && query1}
        style={{
          width: '100%',
          minHeight: '10rem',
          resize: 'none',
          textAlign: 'left',
          whiteSpace: 'pre-line',
          border: '1px solid white',
        }}
      ></textarea>
      <p>
        <button
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
          value={externalTotalCredit}
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
          value={externalPaymentsQuantity}
          onChange={(event) =>
            parseInt(event.target.value) &&
            setExternalPaymentsQuantity(parseInt(event.target.value))
          }
        />
      </p>
      <input
        type="file"
        onChange={(event) => setFile(event.currentTarget.files)}
      />
      <button
        disabled={
          externalOperationNumber === 0 ||
          externalPaymentsQuantity === 0 ||
          externalTotalCredit === 0 ||
          file === undefined
        }
        onClick={(event) => {
          event.preventDefault()
          validate()
        }}
      >
        Validate
      </button>

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
        Total Credit Difference: <b>{fileTotalCredit - externalTotalCredit}</b>
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
      <p>
        <button
          disabled={
            fileOperationNumber !== externalOperationNumber ||
            fileTotalCredit - externalTotalCredit >= 100 ||
            fileTotalCredit - externalTotalCredit <= -100 ||
            filePaymentsQuantity !== externalPaymentsQuantity
          }
          onClick={(event) => {
            event.preventDefault()
            try {
              file && validateData(file[0], sheetName, 'B')
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
            filePaymentsQuantity !== externalPaymentsQuantity
          }
          onClick={async (event) => {
            event.preventDefault()
            try {
              if (file) {
                const updateQueries = await createUpdateQueries(
                  file[0],
                  sheetName,
                  'B'
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
      <textarea
        disabled
        value={query2}
        style={{
          width: '100%',
          minHeight: '10rem',
          resize: 'none',
          textAlign: 'left',
          whiteSpace: 'pre-line',
          border: '1px solid white',
        }}
      ></textarea>
      <p>
        <button
          onClick={(event) => {
            event.preventDefault()
            navigator.clipboard.writeText(query2)
          }}
        >
          Copy Query N°2
        </button>
      </p>
      <p
        style={{
          textAlign: 'left',
          whiteSpace: 'pre-line',
          border: '1px solid white',
          maxHeight: '15rem',
          overflowY: 'scroll',
        }}
      >
        {query3}
      </p>
      <p>
        <button
          onClick={(event) => {
            event.preventDefault()
            navigator.clipboard.writeText(query3)
          }}
        >
          Copy Query N°3
        </button>
      </p>
    </>
  )
}

export default App
