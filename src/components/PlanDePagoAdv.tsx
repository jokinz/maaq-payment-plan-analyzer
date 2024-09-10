import { useRef, useState, useEffect } from 'react'

import Wrapper from '@/components/Wrapper'

import PlanDePagoDetalles from './PlanDePagoDetalles'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Button } from './ui/button'

export type queryData = {
  tipo: number
  nroCuota: number
  fecha: number
  capital: number
  intereses: number
  saldo: number
}

export type operationAndQuery = {
  operation: number
  query: string
}

const PlanDePagoAdv = () => {
  const [files, setFiles] = useState<FileList | null>(null)
  const [filesVersion, setFilesVersion] = useState<number>(0)
  const [allQueries, setAllQueries] = useState<operationAndQuery[]>([])
  
  useEffect(() => {
    if (files && files.length > 0) {
      setFilesVersion((prev) => prev + 1)
    }
  }, [files])

  const fileRef = useRef<HTMLInputElement>(null)

  const updateAllQueries = (queryObject: operationAndQuery) => {
    if (allQueries.length > 0) {
      setAllQueries((prev) => {
        const index: number = prev.findIndex(
          (item) => item.operation === queryObject.operation
        )
        if (index !== -1) {
          prev[index] = queryObject
        }else{
          prev.push(queryObject)
        }
        return [...prev]
      })
    } else {
      setAllQueries([queryObject])
    }
  }

  const mergeQueries = (): string => {
    let mergedQueries: string = ''
    allQueries.forEach((query) => (mergedQueries = mergedQueries + query.query))
    return mergedQueries
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
            multiple
            onChange={(event) => setFiles(event.currentTarget.files)}
          />
        </div>
      </section>
      {files && files.length > 0 && (
        <>
          {Array.from(files).map((file, index) => {
            return (
              <PlanDePagoDetalles
                key={`${index}${filesVersion}`}
                file={file}
              ></PlanDePagoDetalles>
            )
          })}
          <Button
            disabled={allQueries.length === 0}
            onClick={() => navigator.clipboard.writeText(mergeQueries())}
          >
            Copiar todo
          </Button>
        </>
      )}
    </Wrapper>
  )
}

export default PlanDePagoAdv
