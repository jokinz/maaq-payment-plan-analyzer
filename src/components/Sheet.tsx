import { useState } from 'react'
import FormField from './FormField'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export type sheetProps = {
  index: number
  name: string
  checked: boolean
  paymentsQuantity: number
  amortizacionInUse?: number
  interesesInUse?: number
  updateSheetChecked: (index: number) => void
  type: number
  updateSheetType: (index: number, type: number) => void
}

const Sheet = ({
  index,
  name,
  checked,
  paymentsQuantity,
  amortizacionInUse,
  interesesInUse,
  updateSheetChecked,
  updateSheetType,
  type,
}: sheetProps) => {
  const [starterCell, setStarterCell] = useState<string>('C28')

  return (
    <div className="grid grid-cols-6 gap-4 text-left items-center">
      <Checkbox
        id={name}
        checked={checked}
        onClick={() => updateSheetChecked(index)}
      />
      <Label htmlFor="selectedType">Tipo</Label>
      <Select
        value={type.toString()}
        onValueChange={(newType) => updateSheetType(index, Number(newType))}
        name="selectedType"
      >
        <SelectTrigger>
          <SelectValue placeholder="Selec." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={'1'}>1 Financiamiento (Vehiculo)</SelectItem>
          <SelectItem value={'2'}>2 Seguro vehicular (Seguro)</SelectItem>
          <SelectItem value={'3'}>
            3 Seguros de vida (Seguro de vida)
          </SelectItem>
          <SelectItem value={'4'}>4 Seguros externos</SelectItem>
        </SelectContent>
      </Select>
      <Label htmlFor={name}>
        {name} <br />
        Total: [{paymentsQuantity}] <br />
        Amortizacion en uso: [{amortizacionInUse}]<br />
        Intereses en uso: [{interesesInUse}]
      </Label>
      <FormField
        htmlFor="starterCell"
        label="Celda Inicial"
        value={starterCell}
        onChange={(event) => setStarterCell(event.target.value)}
        disabled
      />
    </div>
  )
}

export default Sheet
