import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Button } from './ui/button'

import Query from './Query'

type props = {
  query: string
}

const BackUp = ({ query }: props) => {
  return (
    <Collapsible className="mb-4">
      <CollapsibleTrigger className="mb-4">
        <Button>Crear respaldo</Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Query content={query} />
      </CollapsibleContent>
    </Collapsible>
  )
}

export default BackUp
