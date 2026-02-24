import { useEffect, useRef, useState } from 'react'

import { getColumnData, getColumnNames } from '@/Utils'

import Query from './Query'
import Wrapper from './Wrapper'

import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { checkDicomQuery, insertDicomQuery } from '@/Queries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const CargaDicom = () => {
  const [file, setFile] = useState<FileList | null>(null)
  const [checkQuery, setCheckQuery] = useState<string>('')
  const [insertQuery, setInsertQuery] = useState<string>('')
  const [columnNameList, setColumnNameList] = useState<string[]>([])
  const [contractNumberColumn, setContractNumberColumn] = useState(0)
  const [paymentNumberColumn, setPaymentNumberColumn] = useState(0)
  const [documentNumberColumn, setDocumentNumberColumn] = useState(0)
  const [differentColumns, setDifferentColumns] = useState(false)

  const fileRef = useRef<HTMLInputElement>(null)

  const createCheckQueries = async (
    file: File,
    contractNumberColumn: number,
    paymentNumberColumn: number,
    documentNumberColumn: number
  ): Promise<string> => {
    try {
      const contractList: number[] = await getColumnData(
        file,
        contractNumberColumn
      )
      const paymentList: number[] = await getColumnData(
        file,
        paymentNumberColumn
      )
      const documentList: number[] = await getColumnData(
        file,
        documentNumberColumn
      )
      if (
        contractList.length === documentList.length &&
        documentList.length === paymentList.length
      ) {
        const query: string = checkDicomQuery(
          contractList,
          paymentList,
          documentList
        )
        return query
      } else {
        throw new Error(
          `Número de contratos(${contractList.length}), documentos(${documentList.length}) y cuotas(${paymentList.length}) es diferente`
        )
      }
    } catch (error) {
      alert(error)
      return ''
    }
  }

  const createInsertQueries = async (
    file: File,
    documentNumberColumn: number
  ): Promise<string> => {
    try {
      const documentList: number[] = await getColumnData(
        file,
        documentNumberColumn
      )
      const query: string = insertDicomQuery(documentList)
      return query
    } catch (error) {
      alert(error)
      return ''
    }
  }

  useEffect(() => {
    const checkDifferentColumn: boolean =
      contractNumberColumn === paymentNumberColumn ||
      contractNumberColumn === documentNumberColumn ||
      paymentNumberColumn === documentNumberColumn
    setDifferentColumns(checkDifferentColumn)
    setCheckQuery('')
    setInsertQuery('')
  }, [contractNumberColumn, paymentNumberColumn, documentNumberColumn])

  useEffect(() => {
    if (file && file.length > 0) {
      ;(async () => {
        try {
          const columnNames = await getColumnNames(file[0])
          setColumnNameList(columnNames)
        } catch (error) {
          alert(error)
        }
      })()
    }
  }, [file])

  const handleCreateButtonClick = async () => {
    if (file)
      try {
        const query: string = await createCheckQueries(
          file[0],
          contractNumberColumn,
          paymentNumberColumn,
          documentNumberColumn
        )
        setCheckQuery(query as string)
      } catch (error) {
        alert(error)
      }
  }

  const handleInsertButtonClick = async () => {
    if (file)
      try {
        const query: string = await createInsertQueries(
          file[0],
          documentNumberColumn
        )
        setInsertQuery(query as string)
      } catch (error) {
        alert(error)
      }
  }

  return (
    <Wrapper>
      <h2 className="font-bold">Carga Dicom</h2>
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

        {file && file.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 items-center text-left">
              <Label htmlFor="selectedOperationColumn">Columna Contrato:</Label>
              <Select
                value={columnNameList[contractNumberColumn]}
                onValueChange={(column: string) =>
                  setContractNumberColumn(columnNameList.indexOf(column))
                }
                name="selectedOperationColumn"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar columna" />
                </SelectTrigger>
                <SelectContent>
                  {columnNameList.map((columnName, index) => {
                    return (
                      <SelectItem key={index} value={columnName}>
                        {columnName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center text-left">
              <Label htmlFor="selectedPaymentsColumn">Columna N° cuota:</Label>
              <Select
                value={columnNameList[paymentNumberColumn]}
                onValueChange={(column: string) =>
                  setPaymentNumberColumn(columnNameList.indexOf(column))
                }
                name="selectedPaymentsColumn"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar columna" />
                </SelectTrigger>
                <SelectContent>
                  {columnNameList.map((sheetName, index) => {
                    return (
                      <SelectItem key={index} value={sheetName}>
                        {sheetName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4 items-center text-left">
              <Label htmlFor="selectedDocumentsColumn">
                Columna N° documento:
              </Label>
              <Select
                value={columnNameList[documentNumberColumn]}
                onValueChange={(column: string) =>
                  setDocumentNumberColumn(columnNameList.indexOf(column))
                }
                name="selectedDocumentsColumn"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar columna" />
                </SelectTrigger>
                <SelectContent>
                  {columnNameList.map((sheetName, index) => {
                    return (
                      <SelectItem key={index} value={sheetName}>
                        {sheetName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              disabled={differentColumns}
              onClick={() => handleCreateButtonClick()}
            >
              Crear queries select
            </Button>
            <Query content={checkQuery}></Query>
            <Button
              disabled={differentColumns}
              onClick={() => handleInsertButtonClick()}
            >
              Crear queries insert
            </Button>
            <Query content={insertQuery}></Query>
          </>
        )}
      </section>
    </Wrapper>
  )
}

export default CargaDicom
