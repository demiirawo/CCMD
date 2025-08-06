
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages - using named imports
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { AdminAuth } from "./pages/AdminAuth";
import { CompanySelection } from "./pages/CompanySelection";
import CompanyDashboard from "./pages/CompanyDashboard";
import { Meetings } from "./pages/Meetings";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { QuarterlyReport } from "./pages/QuarterlyReport";
import ReportBuilder from "./pages/ReportBuilder";
import CQCChecklist from "./pages/CQCChecklist";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin/auth" element={<AdminAuth />} />
                
                {/* Protected routes */}
                <Route path="/company-selection" element={
                  <ProtectedRoute>
                    <CompanySelection />
                  </ProtectedRoute>
                } />
                
                <Route path="/company/:slug" element={
                  <ProtectedRoute>
                    <CompanyDashboard />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />

                <Route path="/cqc-checklist" element={
                  <ProtectedRoute>
                    <CQCChecklist />
                  </ProtectedRoute>
                } />
                
                <Route path="/meetings" element={
                  <ProtectedRoute>
                    <Meetings />
                  </ProtectedRoute>
                } />
                
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                
                <Route path="/quarterly-report" element={
                  <ProtectedRoute>
                    <QuarterlyReport />
                  </ProtectedRoute>
                } />
                
                <Route path="/report-builder" element={
                  <ProtectedRoute>
                    <ReportBuilder />
                  </ProtectedRoute>
                } />
                
                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
