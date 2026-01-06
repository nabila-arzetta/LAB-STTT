import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardAdmin } from "./pages/DashboardAdmin";

import Login from "./pages/Login";
import DataInventaris from "./pages/DataInventaris";

import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { MasterBarang } from "./pages/MasterBarang";
import MasterUsers from "./pages/MasterUsers";
import MasterLab from "./pages/MasterLab";
import PenggunaanBarang from "./pages/PenggunaanBarang";
import Logistik from "./pages/Logistik";
import TransferBarang  from "./pages/TransferBarang";
import StokOpname from "./pages/StokOpname";

import LogistikRole from "./pages/LogistikRole";

import Index from "./pages/Index";

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-red-600">
          <h2 className="text-xl font-semibold mb-2">Render Error</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* Protected wrapper: tunggu auth  */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Role LOGISTIK tidak boleh ke halaman admin
  if (user.role === "logistik" && window.location.pathname === "/logistik") {
    return <Navigate to="/logistik-role" replace />;
  }

  return <>{children}</>;
};

/* Dashboard selalu admin  */
const DashboardRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-6">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout>
      <ErrorBoundary>
        <DashboardAdmin />
      </ErrorBoundary>
    </DashboardLayout>
  );
};

/* Halaman debug untuk memastikan Layout+children tampil  */
const DebugPage = () => (
  <DashboardLayout>
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold text-primary">Debug Layout</h1>
      <p>Kalau ini terlihat, berarti Layout + children OK. Masalahnya ada di komponen halaman lain.</p>
    </div>
  </DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />


            {/* Debug */}
            <Route
              path="/_dbg"
              element={
                <ProtectedRoute>
                  <DebugPage />
                </ProtectedRoute>
              }
            />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRoute />
                </ProtectedRoute>
              }
            />

            {/* Halaman lain dalam layout */}
            <Route
              path="/master/barang"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <MasterBarang />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/master/users"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <MasterUsers />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/master/lab"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <MasterLab />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/master/barang"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <MasterLab />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/penggunaan"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <PenggunaanBarang />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistik"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <Logistik />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/logistik-role"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <LogistikRole /> 
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transfer"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <TransferBarang />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inventaris"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <DataInventaris />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/stok-opname"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ErrorBoundary>
                      <StokOpname />
                    </ErrorBoundary>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            {/* Fallback */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
