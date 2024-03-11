import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

function Query(props: { content: string; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-12 col-span-2 gap-4">
      <Textarea
        style={{ gridColumn: 'span 12 / span 12' }}
        disabled
        value={props.content}
        className="textarea-query min-h-[150]"
      ></Textarea>
      <Button
        style={{ gridColumn: '12 / span 1' }}
        disabled={props.content === ''}
        onClick={(event) => {
          event.preventDefault()
          navigator.clipboard.writeText(props.content)
        }}
      >
        Copiar
      </Button>
    </div>
  )
}

export default Query
