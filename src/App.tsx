import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CompanyDataIsolationProvider } from "./components/CompanyDataIsolationProvider";
import { useAuth } from "@/hooks/useAuth";

import { useTheme } from "./hooks/useTheme";
import Index from "./pages/Index";
import Landing from "./pages/Landing";

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

const queryClient = new QueryClient();

const AppContent = () => {
  console.log('AppContent rendering, pathname:', window.location.pathname);
  useTheme(); // Apply theme across all pages
  console.log('About to render Routes');
  
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminAuth />} />
      
      <Route path="/company-selection" element={
        <ProtectedRoute>
          <CompanySelection />
        </ProtectedRoute>
      } />
      <Route path="/company/:slug" element={<CompanyDashboard />} />
      <Route path="/" element={
        <>
          {console.log('Root route "/" matched, rendering Landing')}
          {(() => {
            console.log('Inline component executing');
            const { user, profile, companies, loading } = useAuth();
            console.log('Inline auth state:', { user: !!user, profile: !!profile, companies: companies.length, loading });
            
            if (loading) {
              return (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading...</p>
                  </div>
                </div>
              );
            }
            
            if (user && profile && profile.company_id && companies.length > 0) {
              const currentCompany = companies.find(c => c.id === profile.company_id);
              if (currentCompany) {
                const slug = ('slug' in currentCompany && currentCompany.slug) || 
                           currentCompany.name.toLowerCase().replace(/\s+/g, '-');
                console.log('Redirecting to company dashboard:', slug);
                return <Navigate to={`/company/${slug}`} replace />;
              }
            }
            
            console.log('Redirecting to company selection');
            return <Navigate to="/company-selection" replace />;
          })()}
        </>
      } />
      <Route path="/meetings" element={
        <ProtectedRoute requireCompany>
          <>
            <Navigation />
            <Meetings />
          </>
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
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CompanyDataIsolationProvider enableLogging={true}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </CompanyDataIsolationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
