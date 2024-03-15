import './App.css'

import { ThemeProvider } from '@/components/theme-provider'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import PlanDePago from './components/PlanDePago'
import TraspasoDeBienesYBaja from './components/TraspasoDeBienesYBaja'
import NumerosDos from './components/NumerosDos'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <Tabs defaultValue="paymentPlan">
        <TabsList>
          <TabsTrigger value="paymentPlan">
            Aplicación de plan de pago
          </TabsTrigger>
          <TabsTrigger value="goodsTransfer">
            Traspaso de bienes y baja
          </TabsTrigger>
          <TabsTrigger value="numberTwos">Números Dos</TabsTrigger>
        </TabsList>
        <TabsContent value="paymentPlan">
          <PlanDePago />
        </TabsContent>
        <TabsContent value="goodsTransfer">
          <TraspasoDeBienesYBaja />
        </TabsContent>
        <TabsContent value="numberTwos">
          <NumerosDos />
        </TabsContent>
      </Tabs>
    </ThemeProvider>
  )
}

export default App
