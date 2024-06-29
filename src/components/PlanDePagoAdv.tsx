import { useEffect, useRef, useState } from 'react'

import * as XLSX from 'xlsx'

import { unityInsertQuery } from '@/Queries'
import {
  extractSheetNamesFromFormula,
  findIndexInRange,
  getCellValue,
  getColumnFormulas,
  getSheetsProps,
  readFile,
} from '@/Utils'

import Wrapper from '@/components/Wrapper'
import Query from './Query'
import Sheet, { sheetProps } from './Sheet'

import FormField from './FormField'
import { LoadingSpinner } from './LoadingSpinner'
import { Button } from './ui/button'
import PlanDePagoDetalles from './PlanDePagoDetalles'
import { Input } from './ui/input'
import { Label } from './ui/label'

export type queryData = {
  tipo: number
  nroCuota: number
  fecha: number
  cuota: number
  capital: number
  intereses: number
  saldo: number
}

const PlanDePagoAdv = () => {
  const [file, setFile] = useState<FileList | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

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
      {file &&
        file.length > 0 &&
        Array.from(file).map((file, index) => {
          return (
            <PlanDePagoDetalles key={index} file={file}></PlanDePagoDetalles>
          )
        })}
    </Wrapper>
  )
}

export default PlanDePagoAdv
