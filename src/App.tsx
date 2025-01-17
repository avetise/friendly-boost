import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Generate from "./pages/Generate";
import Resume from "./pages/Resume";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Referral from "./pages/Referral";
import View from "./pages/View";
import Success from "./pages/Success";
import Admin from "./pages/Admin";
import Invite from "./pages/Invite";
import { PricingPlans } from "@/components/subscription/PricingPlans";
import { SubCheck } from '@/components/subscription/SubCheck';

const queryClient = new QueryClient();
console.log("App.tsx: Rendering...");

// Protected Route wrapper component
const ProtectedRoute = ({
  children,
  requiredRole,
  requiredPlan,
}: {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPlan?: string;
}) => {
  const { user, loading, userDetails } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredRole && userDetails?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  // Subscription check using localStorage
  if (requiredPlan && !SubCheck()) {
      return <Navigate to="/account" />;
  }

  return <>{children}</>;
};


const App = () => (
  <ThemeProvider>
    <BrowserRouter basename="/app">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/generate"
                element={
                  <ProtectedRoute>
                    <Generate />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/resume"
                element={
                  <ProtectedRoute requiredPlan="price_1QbOq6BsWcSPhj7F2R2003OT">
                    <Resume />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="Admin">
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invite"
                element={
                  <ProtectedRoute>
                    <Invite />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <PricingPlans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/success"
                element={
                  <ProtectedRoute>
                    <Success />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/referral"
                element={
                  <ProtectedRoute>
                    <Referral />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view/coverletter/:id"
                element={
                  <ProtectedRoute>
                    <View collection="coverletters" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view/resume/:id"
                element={
                  <ProtectedRoute>
                    <View collection="resumes" />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<div>404: Page Not Found</div>} />
            </Routes>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;