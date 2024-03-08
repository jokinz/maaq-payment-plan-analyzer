import './App.css'

import { ThemeProvider } from '@/components/theme-provider'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import PlanDePago from './components/PlanDePago'
import TraspasoDeBienesYBaja from './components/TraspasoDeBienesYBaja'

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Tabs defaultValue="paymentPlan">
          <TabsList>
            <TabsTrigger value="paymentPlan">
              Aplicación de plan de pago
            </TabsTrigger>
            <TabsTrigger value="goodsTransfer">
              Traspaso de bienes y baja
            </TabsTrigger>
          </TabsList>
          <TabsContent value="paymentPlan">
            <PlanDePago />
          </TabsContent>
          <TabsContent value="goodsTransfer">
            <TraspasoDeBienesYBaja />
          </TabsContent>
        </Tabs>
      </ThemeProvider>
    </>
  )
}

export default App
