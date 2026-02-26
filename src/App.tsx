import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRouter from "@/components/RoleRouter";
import OSLayout from "@/components/layout/OSLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminOverview from "./pages/admin/Overview";
import AdminJobs from "./pages/admin/Jobs";
import AdminCustomers from "./pages/admin/Customers";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import RoleManagementTab from "./components/admin/RoleManagementTab";
import AdminCrew from "./pages/admin/Crew";

// Tech pages
import TechMyJobs from "./pages/tech/MyJobs";
import TechProfile from "./pages/tech/Profile";

const queryClient = new QueryClient();

const StaffOS = () => (
  <OSLayout />
);

const AdminRoutes = () => (
  <Routes>
    <Route element={<OSLayout />}>
      <Route index element={<AdminOverview />} />
      <Route path="jobs" element={<AdminJobs />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="subscriptions" element={<AdminSubscriptions />} />
      <Route path="roles" element={<RoleManagementTab />} />
      <Route path="crew" element={<AdminCrew />} />
    </Route>
  </Routes>
);

const TechRoutes = () => (
  <Routes>
    <Route element={<OSLayout />}>
      <Route index element={<TechMyJobs />} />
      <Route path="profile" element={<TechProfile />} />
    </Route>
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard/*"
              element={
                <ProtectedRoute>
                  <RoleRouter
                    admin={<AdminRoutes />}
                    technician={<TechRoutes />}
                    customer={<Dashboard />}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
