import { getCellFunction } from '@/Utils'
import { useEffect, useState } from 'react'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import FormField from './FormField'

type props = {
  sheetName: string
  file: File
}

const targetSheetNames: string[] = [
  'vehiculo',
  'seguro vehicula',
  'seguro de vida',
]

const webpcf = 'WEBPCF'

const Sheet = ({ sheetName, file }: props) => {
  const [contains, setContains] = useState<boolean>(false)
  const [starterCell, setStarterCell] = useState<string>('C28')

  useEffect(() => {
    const cellContainsString = async () => {
      try {
        const cellFunction = (await getCellFunction(
          file,
          webpcf,
          'E10'
        )) as string
        if (
          cellFunction.includes(sheetName) &&
          (cellFunction.includes(targetSheetNames[0]) ||
            cellFunction.includes(targetSheetNames[1]) ||
            cellFunction.includes(targetSheetNames[2]))
        ) {
          setContains(true)
        }
      } catch (error) {
        console.error(error)
      }
    }
    cellContainsString()
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4 text-left items-center">
      <Checkbox
        id={sheetName}
        checked={contains}
        onClick={() => setContains(!contains)}
      />
      <Label htmlFor={sheetName}>{sheetName}</Label>
      <FormField
        htmlFor="starterCell"
        label="Celda Inicial"
        value={starterCell}
        disabled
      />
    </div>
  )
}

export default Sheet
