import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRouter from "@/components/RoleRouter";
import OSLayout from "@/components/layout/OSLayout";
import Index from "./pages/Index";
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
import AdminRouteIntelligence from "./pages/admin/RouteIntelligence";
import AdminCalendar from "./pages/admin/Calendar";
import AdminNotifications from "./pages/admin/Notifications";
import AdminPricing from "./pages/admin/Pricing";
import AdminAddons from "./pages/admin/Addons";
import AdminLeaderboard from "./pages/admin/Leaderboard";
import AdminReports from "./pages/admin/Reports";

// Tech pages
import TechMyJobs from "./pages/tech/MyJobs";
import TechMyRoute from "./pages/tech/MyRoute";
import TechProfile from "./pages/tech/Profile";

const queryClient = new QueryClient();

const AdminRoutes = () => (
  <Routes>
    <Route element={<OSLayout />}>
      <Route index element={<AdminOverview />} />
      <Route path="jobs" element={<AdminJobs />} />
      <Route path="customers" element={<AdminCustomers />} />
      <Route path="subscriptions" element={<AdminSubscriptions />} />
      <Route path="addons" element={<AdminAddons />} />
      <Route path="leaderboard" element={<AdminLeaderboard />} />
      <Route path="roles" element={<RoleManagementTab />} />
      <Route path="crew" element={<AdminCrew />} />
      <Route path="routes" element={<AdminRouteIntelligence />} />
      <Route path="calendar" element={<AdminCalendar />} />
      <Route path="notifications" element={<AdminNotifications />} />
      <Route path="pricing" element={<AdminPricing />} />
      <Route path="reports" element={<AdminReports />} />
    </Route>
  </Routes>
);

const TechRoutes = () => (
  <Routes>
    <Route element={<OSLayout />}>
      <Route index element={<TechMyJobs />} />
      <Route path="my-route" element={<TechMyRoute />} />
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
            <Route path="/" element={<Navigate to="/auth" replace />} />
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
