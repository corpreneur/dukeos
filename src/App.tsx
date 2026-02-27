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
import AdminOrganization from "./pages/admin/Organization";
import AdminGBP from "./pages/admin/GBPIntegration";
import Quote from "./pages/Quote";

// Tech pages
import TechMyJobs from "./pages/tech/MyJobs";
import TechMyRoute from "./pages/tech/MyRoute";
import TechProfile from "./pages/tech/Profile";

// Billing pages
import BillingLayout from "./pages/billing/BillingLayout";
import PaymentMethods from "./pages/billing/PaymentMethods";
import InvoiceHistory from "./pages/billing/InvoiceHistory";
import Receipts from "./pages/billing/Receipts";

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
      <Route path="organization" element={<AdminOrganization />} />
      <Route path="gbp" element={<AdminGBP />} />
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
            <Route path="/quote" element={<Quote />} />
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
            <Route
              path="/dashboard/billing/*"
              element={
                <ProtectedRoute>
                  <BillingLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PaymentMethods />} />
              <Route path="invoices" element={<InvoiceHistory />} />
              <Route path="receipts" element={<Receipts />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
