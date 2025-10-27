import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Results from "./pages/Results";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";
import AdminLayout from './admin/layout/AdminLayout';
import Login from './admin/pages/Login';
import RotasTarifas from './admin/pages/RotasTarifas';
import Veiculos from './admin/pages/Veiculos';
import CheckoutConfig from './admin/pages/CheckoutConfig';
import PreReserva from "./pages/PreReserva";
import Configuracoes from './admin/pages/Configuracoes';
import Sobre from './admin/pages/Sobre';
import MenuFrontEnd from './admin/pages/MenuFrontEnd';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/results" element={<Results />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={<AdminLayout />}> 
            <Route index element={<RotasTarifas />} />
            <Route path="rotas-tarifas" element={<RotasTarifas />} />
            <Route path="veiculos" element={<Veiculos />} />
            <Route path="checkout" element={<CheckoutConfig />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="menu-front" element={<MenuFrontEnd />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/pre-reserva" element={<PreReserva />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
