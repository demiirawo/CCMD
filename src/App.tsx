import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Auth } from "./pages/Auth";
import { CompanySelection } from "./pages/CompanySelection";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/company-selection" element={
              <ProtectedRoute>
                <CompanySelection />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute requireCompany>
                <>
                  <Navigation />
                  <Index />
                </>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requireCompany>
                <>
                  <Navigation />
                  <Reports />
                </>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireCompany>
                <>
                  <Navigation />
                  <Settings />
                </>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
