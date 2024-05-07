import { getOperationsList } from '@/Utils'
import { useEffect, useRef, useState } from 'react'
import Wrapper from './Wrapper'
import { Label } from '@radix-ui/react-label'
import { Input } from './ui/input'

const NumerosDos = () => {
  const [file, setFile] = useState<FileList | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) {
      ;(async () => {
        try {
          const operationList = await getOperationsList(file[0])
          console.log(operationList)
        } catch (error) {
          alert(error)
        }
      })()
    }
  }, [file])

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
      </section>
    </Wrapper>
  )
}

export default NumerosDos
