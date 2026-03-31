import { useState } from 'react'

import '../App.css'

import Query from './Query'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import FormField from '@/components/FormField'
import Wrapper from '@/components/Wrapper'
import BackUp from './BackUp'
import { goodsBackupQuery, transferGoodsQuery } from '@/Queries'

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
  { value: '3', text: 'CASTIGO NO RECUPERADO/INCAUTACIÓN DE BIENES' },
  { value: '4', text: 'VENCIDAS INCONSISTENTES' },
  { value: '5', text: 'CANCELADO MODIFICADO' },
  { value: '6', text: 'CANCELADO - REPROGRAMADO' },
  { value: '7', text: 'ANULADO' },
  { value: '8', text: 'INCOBRABLE' },
  { value: '9', text: 'CANCELADO NOVADO' },
]

function TraspasoDeBienesYBaja() {
  const [sourceOperation, setSourceOperation] = useState<number>(0)
  const [targetOperation, setTargetOperation] = useState<number>(0)
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [includeStatus, setIncludeStatus] = useState<'include' | 'exclude'>(
    'include'
  )
  const [good, setGood] = useState<string>('')
  const [goodsList, setGoodsList] = useState<string[]>([])

  const restartValues = () => {
    setSourceOperation(0)
    setTargetOperation(0)
    setSelectedStatus('')
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <Wrapper>
      <h2 className="font-bold">Traspaso de bienes y baja</h2>
      <BackUp query={goodsBackupQuery(new Date())} />
      <section className="grid grid-cols-2 gap-8 items-center">
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <FormField
            htmlFor="targetOperation"
            label="Operación Objetivo"
            value={targetOperation ? targetOperation : ''}
            onChange={(event) => {
              setTargetOperation(parseInt(event.target.value))
            }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <FormField
            htmlFor="sourceOperation"
            label="Operation Fuente"
            value={sourceOperation ? sourceOperation : ''}
            style={
              sourceOperation && sourceOperation >= targetOperation
                ? { borderColor: 'red' }
                : { borderColor: 'inherit' }
            }
            onChange={(event) => {
              event.preventDefault()
              setSourceOperation(parseInt(event.target.value))
            }}
          />
        </div>
        <Query
          content={
            targetOperation
              ? `SELECT * FROM SCA_ADMINI..GAR WHERE FLD_GAR_OPER = ${targetOperation}
SELECT * FROM SCA_ADMINI..GAR WHERE FLD_GAR_OPER = ${sourceOperation}
DELETE FROM SCA_ADMINI..GAR WHERE FLD_GAR_OPER = ${targetOperation}`
              : ''
          }
        ></Query>
        <div className="grid grid-cols-2 gap-4 items-center text-left">
          <FormField
            htmlFor="Bien"
            label="Bien"
            value={good}
            onChange={(event) => {
              setGood(event.target.value)
            }}
          />
        </div>
        <Button
          disabled={good === ''}
          onClick={(event) => {
            event.preventDefault()
            setGoodsList((prevState) => [...prevState, good])
            setGood('')
          }}
        >
          Agregar
        </Button>
        {goodsList.length > 0 && (
          <div className="grid grid-cols-12 gap-2 items-center col-span-2">
            <div className="col-span-2 text-left">
              <Select
                value={includeStatus}
                onValueChange={(value: 'include' | 'exclude') =>
                  setIncludeStatus(value)
                }
                name="selectedStatus"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hoja" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key={1} value={'include'}>
                    Incluir solo:
                  </SelectItem>
                  <SelectItem key={2} value={'exclude'}>
                    Excluir bienes:
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='col-span-10 text-left gap-2 flex'>
              {goodsList.map((item, index) => (
                <Button
                  key={index}
                  variant={'destructive'}
                  onClick={(event) => {
                    event.preventDefault()
                    setGoodsList((prevState) =>
                      prevState.filter((item2) => item2 !== item)
                    )
                  }}
                >
                  {item} X
                </Button>
              ))}
            </div>
          </div>
        )}

        <Query
          content={transferGoodsQuery(
            sourceOperation,
            targetOperation,
            goodsList,
            includeStatus
          )}
        ></Query>

        {sourceOperation !== 0 && (
          <>
            <Label htmlFor="selectedStatus">Nuevo estado: </Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value)}
              name="selectedStatus"
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {StatusList.map((status, index) => {
                  return (
                    <SelectItem key={index} value={status.value}>
                      {status.text}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedStatus !== '' && (
              <Query
                content={`UPDATE SCA_ADMINI..TCO 
       SET FLD_TCO_EOPE = '${selectedStatus}'
       WHERE  FLD_TCO_OPER IN(${sourceOperation}) --1`}
              ></Query>
            )}
          </>
        )}
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

export default TraspasoDeBienesYBaja
