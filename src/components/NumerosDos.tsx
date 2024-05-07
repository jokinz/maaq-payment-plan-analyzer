import { useEffect, useRef, useState } from 'react'

import { getColumnData } from '@/Utils'

import Wrapper from './Wrapper'
import Query from './Query'

import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { updateOperationPaymentsQuery } from '@/Queries'

const numerosDosSheetName = 'MQExcel'
const operationColumnName = 'Operación'
const paymentColumnName = 'Cuota'

const NumerosDos = () => {
  const [updateNumber, setUpdateNumber] = useState<number>(2)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
  const [file, setFile] = useState<FileList | null>(null)
  const [query, setQuery] = useState<string>('')

  const fileRef = useRef<HTMLInputElement>(null)

  const createQueries = async (file: File) => {
    try {
      const operationList = await getColumnData(
        file,
        numerosDosSheetName,
        'A',
        operationColumnName
      )
      const paymentList = await getColumnData(
        file,
        numerosDosSheetName,
        'E',
        paymentColumnName
      )
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
          const query = await createQueries(file[0])
          setQuery(query as string)
        } catch (error) {
          alert(error)
        }
      })()
    }
  }, [file, updatingStatus])

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
              if (isNaN(parseInt(value))) {
                setUpdateNumber(0)
              } else {
                setUpdateNumber(parseInt(value))
              }
              
            }}
          />
          <Button onClick={() => setUpdatingStatus((prev) => !prev)}>
            {!updatingStatus ? 'Cambiar' : 'Actualizar'}
          </Button>
        </div>
        <Query content={query}></Query>
      </section>
    </Wrapper>
  )
}

export default NumerosDos
