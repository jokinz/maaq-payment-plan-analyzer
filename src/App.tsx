import './App.css'

import { ThemeProvider } from '@/components/theme-provider'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import PlanDePago from './components/PlanDePago'
import TraspasoDeBienesYBaja from './components/TraspasoDeBienesYBaja'
import NumerosDos from './components/NumerosDos'
import PlanDePagoAdv from './components/PlanDePagoAdv'
import CargaDicom from './components/CargaDicom'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Tabs defaultValue="paymentPlan">
        <TabsList>
          <TabsTrigger value="paymentPlan">Plan de pago</TabsTrigger>
          <TabsTrigger value="goodsTransfer">
            Traspaso de bienes y baja
          </TabsTrigger>
          <TabsTrigger value="numberTwos">Números Dos</TabsTrigger>
          <TabsTrigger value="paymentPlanAdvanced">
            Plan de pago Adv.
          </TabsTrigger>
          <TabsTrigger value="cargaDicom">
            Carga Dicom
          </TabsTrigger>
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
        <TabsContent value="paymentPlanAdvanced">
          <PlanDePagoAdv />
        </TabsContent>
        <TabsContent value="cargaDicom">
          <CargaDicom />
        </TabsContent>
      </Tabs>
    </ThemeProvider>
  )
}

export default App
