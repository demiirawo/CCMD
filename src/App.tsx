import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { DataIsolationWrapper } from "./components/DataIsolationWrapper";
import { RootRedirect } from "./components/RootRedirect";

import { useTheme } from "./hooks/useTheme";
import Index from "./pages/Index";

import { Reports } from "./pages/Reports";
import { QuarterlyReport } from "./pages/QuarterlyReport";
import ReportBuilder from "./pages/ReportBuilder";
import { Settings } from "./pages/Settings";
import { Meetings } from "./pages/Meetings";
import Inspection from "./pages/Inspection";
import { Auth } from "./pages/Auth";
import { AdminAuth } from "./pages/AdminAuth";
import { CompanySelection } from "./pages/CompanySelection";
import NotFound from "./pages/NotFound";
import CompanyDashboard from "./pages/CompanyDashboard";
import { SharedTable } from "./pages/SharedTable";
import { PublicTable } from "./pages/PublicTable";
import { Matching } from "./pages/Matching";

const queryClient = new QueryClient();

const AppContent = () => {
  console.log('AppContent rendering, pathname:', window.location.pathname);
  useTheme(); // Apply theme across all pages
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminAuth />} />
      
      <Route path="/company-selection" element={
        <ProtectedRoute>
          <CompanySelection />
        </ProtectedRoute>
      } />
      <Route path="/company/:slug" element={
        <DataIsolationWrapper enableLogging={true}>
          <CompanyDashboard />
        </DataIsolationWrapper>
      } />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/shared/:token" element={<SharedTable />} />
      <Route path="/public/:tableId" element={<PublicTable />} />
      <Route path="/meetings" element={
        <ProtectedRoute requireCompany>
          <DataIsolationWrapper enableLogging={true}>
            <Navigation />
            <Meetings />
          </DataIsolationWrapper>
        </ProtectedRoute>
      } />
      <Route path="/inspection" element={
        <ProtectedRoute requireCompany>
          <Inspection />
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
      <Route path="/quarterly-report" element={
        <ProtectedRoute requireCompany>
          <QuarterlyReport />
        </ProtectedRoute>
      } />
      <Route path="/report-builder" element={
        <ProtectedRoute requireCompany>
          <ReportBuilder />
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
      <Route path="/matching" element={
        <ProtectedRoute requireCompany>
          <>
            <Navigation />
            <Matching />
          </>
        </ProtectedRoute>
      } />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;