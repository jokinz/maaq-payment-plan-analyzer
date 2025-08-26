import { useEffect, useRef, useState } from 'react'

import { getColumnData, getColumnNames } from '@/Utils'

import Wrapper from './Wrapper'
import Query from './Query'

import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { updateOperationPaymentsQuery } from '@/Queries'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

const NumerosDos = () => {
  const [updateNumber, setUpdateNumber] = useState<number | string>(2)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
  const [file, setFile] = useState<FileList | null>(null)
  const [query, setQuery] = useState<string>('')
  const [columnNameList, setColumnNameList] = useState<string[]>([])
  const [operationNumberColumn, setOperationNumberColumn] = useState(0)
  const [paymentNumberColumn, setPaymentNumberColumn] = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)

  const createQueries = async (
    file: File,
    operationNumberColumn: number,
    paymentNumberColumn: number
  ) => {
    try {
      const operationList = await getColumnData(file, operationNumberColumn)
      const paymentList = await getColumnData(file, paymentNumberColumn)
      if (operationList.length === paymentList.length) {
        let data: string = ''
        operationList.forEach(
          (operation, index) =>
            (data += updateOperationPaymentsQuery(
              operation,
              updateNumber,
              paymentList[index]
            ))
        )
        return data
      } else {
        throw new Error('Número de operaciones y cuotas es diferente')
      }
    } catch (error) {
      alert(error)
    }
  }

  useEffect(() => {
    if (file && !updatingStatus) {
      ;(async () => {
        try {
          const columnNames = await getColumnNames(file[0])
          setColumnNameList(columnNames)
        } catch (error) {
          alert(error)
        }
      })()
    }
  }, [file, updatingStatus])

  const handleButtonClick = async () => {
    if (file && !updatingStatus)
      try {
        const query = await createQueries(
          file[0],
          operationNumberColumn,
          paymentNumberColumn
        )
        setQuery(query as string)
      } catch (error) {
        alert(error)
      }
  }

  return (
    <Wrapper>
      <h2 className="font-bold">Números 2</h2>
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
          <Input
            id="updateNumber"
            disabled={!updatingStatus}
            value={updateNumber}
            type="text"
            onChange={(event) => {
              const value = event.target.value.replace(/[^0-9]/g, '')
              if (value === '') {
                setUpdateNumber('')
              } else {
                if (isNaN(parseInt(value))) {
                  setUpdateNumber(0)
                } else {
                  setUpdateNumber(parseInt(value))
                }
              }
            }}
          />
          <Button onClick={() => setUpdatingStatus((prev) => !prev)}>
            {!updatingStatus ? 'Cambiar' : 'Actualizar'}
          </Button>
        </div>
        {file && file.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 items-center text-left">
              <Label htmlFor="selectedOperationColumn">
                Columna Operación:
              </Label>
              <Select
                value={columnNameList[operationNumberColumn]}
                onValueChange={(column: string) =>
                  setOperationNumberColumn(columnNameList.indexOf(column))
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
          </>
        )}
        <Button disabled={updatingStatus} onClick={() => handleButtonClick()}>
          Crear queries
        </Button>

        <Query content={query}></Query>
      </section>
    </Wrapper>
  )
}

export default NumerosDos
