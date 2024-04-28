import { containsString, getCellFunction, getCellValue } from '@/Utils'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const cellContainsString = async () => {
      try {
        const cellFunction = (await getCellFunction(
          file,
          webpcf,
          'E10'
        )) as string
        console.log(cellFunction)
        if (
          //   containsString(cellFunction, targetSheetNames) &&
          cellFunction.includes(sheetName)
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
    <li className={contains ? 'text-green-500' : 'text-red-500'}>
      {sheetName}
    </li>
  )
}

export default Sheet
