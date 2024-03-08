import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"


function Query(props: { content: string; disabled?: boolean }) {
  return (
    <p style={{ textAlign: 'right' }}>
      <Textarea
        disabled
        value={props.content}
        className="textarea-query"
      ></Textarea>
      <Button
        disabled={props.content === ''}
        onClick={(event) => {
          event.preventDefault()
          navigator.clipboard.writeText(props.content)
        }}
      >
        Copiar
      </Button>
    </p>
  )
}

export default Query
