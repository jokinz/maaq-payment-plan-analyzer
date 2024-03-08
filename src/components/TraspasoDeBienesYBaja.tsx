import { useState } from 'react'

import '../App.css'

import Query from './Query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from './ui/label'

type Status = {
  value: string
  text: string
}
const StatusList: Status[] = [
  { value: '0', text: 'VIGENTE' },
  { value: '1', text: 'CANCELADA' },
  { value: '10', text: 'CANCELADO SINESTRADO' },
  { value: '11', text: 'DEVOLUCION VOLUNTARIA' },
  { value: '12', text: 'CANCELADO PREPAGO' },
  { value: '2', text: 'EXTINGUIDA' },
  { value: '3', text: 'CASTIGO NO RECUPERADO' },
  { value: '4', text: 'VENCIDAS INCONSISTENTES' },
  { value: '5', text: 'CANCELADO MODIFICADO' },
  { value: '6', text: 'CANCELADO - REPROGRAMADO' },
  { value: '7', text: 'ANULADO' },
  { value: '8', text: 'INCOBRABLE' },
  { value: '9', text: 'CANCELADO NOVADO' },
]

function TraspasoDeBienesYBaja() {
  const [sourceOperation, setSourceOperation] = useState(0)
  const [targetOperation, setTargetOperation] = useState(0)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [exception, setException] = useState('')
  const [exceptionsList, setExceptionsList] = useState<string[]>([])
  console.log(selectedStatus)

  return (
    <div className="flex flex-col gap-3">
      <h2>Traspaso de bienes y baja</h2>
      <p>
        <Label htmlFor="targetOperation">Operación Objetivo: </Label>
        <Input
          id="targetOperation"
          value={targetOperation}
          onChange={(event) => {
            setTargetOperation(parseInt(event.target.value))
          }}
        />
      </p>
      <p>
        <Label htmlFor="sourceOperation">Operation Fuente: </Label>
        <Input
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
      <p>
        <Label htmlFor="exception">Excepción: </Label>
        <Input
          id="exception"
          value={exception}
          onChange={(event) => {
            setException(event.target.value)
          }}
        />
      </p>
      <Button
        disabled={exception === ''}
        onClick={(event) => {
          event.preventDefault()
          setExceptionsList((prevState) => [...prevState, exception])
          setException('')
        }}
      >
        Agregar
      </Button>
      {exceptionsList.length > 0 && (
        <>
          <p>Excepciones: </p>
          {exceptionsList.map((item, index) => (
            <p key={index}>
              {item}{' '}
              <Button
                onClick={(event) => {
                  event.preventDefault()
                  setExceptionsList((prevState) =>
                    prevState.filter((item2) => item2 !== item)
                  )
                }}
              >
                X
              </Button>
            </p>
          ))}
        </>
      )}

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
       ${
         exceptionsList.length > 0
           ? `AND LTRIM(RTRIM(FLD_GAR_BLOC)) NOT IN(${exceptionsList.map(
               (item) => `'${item}'`
             )})`
           : ''
       }
       ORDER BY  FLD_GAR_BLOC`
            : ''
        }
      ></Query>

      {sourceOperation !== 0 && (
        <>
          <Label htmlFor="selectedStatus">Nuevo estado: </Label>
          <Select
            value={selectedStatus.toString()}
            onValueChange={(value) => setSelectedStatus(value)}
            name="selectedStatus"
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              {StatusList.map((status, index) => {
                return (
                  <SelectItem key={index} value={status.value.toString()}>
                    {status.text}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {/* <select
            defaultValue={-1}
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(parseInt(event.target.value))
            }
            name="selectedStatus"
            id="selectedStatus"
          >
            <option disabled value={-1}>
              Seleccionar
            </option>
            {StatusList.map((status) => {
              return <option value={status.value}>{status.text}</option>
            })}
          </select> */}
          {selectedStatus !== '' && (
            <Query
              content={`UPDATE SCA_ADMINI..TCO 
       SET FLD_TCO_EOPE = '${selectedStatus}'
       WHERE  FLD_TCO_OPER IN(${sourceOperation}) --1`}
            ></Query>
          )}
        </>
      )}
    </div>
  )
}

export default TraspasoDeBienesYBaja
