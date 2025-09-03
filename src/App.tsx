import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Simulation from "./pages/Simulation";
import Simulations from "./pages/Simulations";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/simulation" element={
              <ProtectedRoute>
                <AppLayout>
                  <Simulation />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/simulations" element={
              <ProtectedRoute>
                <AppLayout>
                  <Simulations />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/results/:id" element={
              <ProtectedRoute>
                <AppLayout>
                  <Results />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/results" element={
              <ProtectedRoute>
                <AppLayout>
                  <Simulations />
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/registry" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Registro de Dados</h1>
                    <p className="text-muted-foreground mt-2">Em desenvolvimento...</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/reports" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Relatórios Executivos</h1>
                    <p className="text-muted-foreground mt-2">Em desenvolvimento...</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/suppliers" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Fornecedores e Clientes</h1>
                    <p className="text-muted-foreground mt-2">Em desenvolvimento...</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="p-6">
                    <h1 className="text-2xl font-bold">Configurações</h1>
                    <p className="text-muted-foreground mt-2">Em desenvolvimento...</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
