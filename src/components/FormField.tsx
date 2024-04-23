import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
type props = {
  label: string
  htmlFor: string
  value: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  readOnly?: boolean
  style?: {}
  labelBoldNote?: string
}
const FormField = ({
  label,
  htmlFor,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  style,
  labelBoldNote = '',
}: props) => {
  const labelText =
    labelBoldNote !== '' ? (
      <>
        {label} <b>{labelBoldNote}</b>:
      </>
    ) : (
      label + ':'
    )
  return (
    <>
      <Label htmlFor={htmlFor}>{labelText}</Label>
      <Input
        id={htmlFor}
        type="text"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={onChange}
        style={style}
      />
    </>
  )
}

export default FormField
