import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCopy } from '@fortawesome/free-solid-svg-icons'

type props = {
  content: string
}

function Query({ content }: props) {
  return (
    <div className="grid grid-cols-12 col-span-2 gap-4">
      <Textarea
        style={{ gridColumn: 'span 12 / span 12' }}
        disabled
        value={content}
        className="textarea-query min-h-[150]"
      ></Textarea>
      <Button
        style={{ gridColumn: '12 / span 1' }}
        disabled={content === ''}
        onClick={(event) => {
          event.preventDefault()
          navigator.clipboard.writeText(content)
        }}
      >
        Copiar <FontAwesomeIcon className="ml-2" icon={faCopy} />
      </Button>
    </div>
  )
}

export default Query
