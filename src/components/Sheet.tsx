import { useState } from 'react'
import FormField from './FormField'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'

export type sheetProps = {
  name: string
  checked: boolean
  paymentsQuantity: number
  updateList: (index: number) => void
}

const Sheet = (
  { name, checked, paymentsQuantity, updateList }: sheetProps,
  key: number
) => {
  const [starterCell, setStarterCell] = useState<string>('C28')

  return (
    <div className="grid grid-cols-4 gap-4 text-left items-center">
      <Checkbox id={name} checked={checked} onClick={() => updateList(key)} />
      <Label htmlFor={name}>
        {name}({paymentsQuantity})
      </Label>
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
