import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Leaf,
  LogOut,
  Briefcase,
  CalendarDays,
  Users,
  CreditCard,
  ShieldCheck,
  MapPin,
  Camera,
  User,
  HardHat,
  Route,
  Calendar,
  Bell,
  DollarSign,
  Sparkles,
  Trophy,
  BarChart3,
  Building2,
  Star,
} from "lucide-react";
import { ReleaseTracker } from "@/components/layout/ReleaseTracker";
import ThemeToggle from "@/components/layout/ThemeToggle";
import OfflineIndicator from "@/components/tech/OfflineIndicator";
import PushNotificationToggle from "@/components/tech/PushNotificationToggle";

const adminNav = [
  { title: "Overview", url: "/dashboard", icon: Briefcase, end: true },
  { title: "Jobs", url: "/dashboard/jobs", icon: CalendarDays },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Subscriptions", url: "/dashboard/subscriptions", icon: CreditCard },
  { title: "Add-ons", url: "/dashboard/addons", icon: Sparkles },
  { title: "Crew", url: "/dashboard/crew", icon: HardHat },
  { title: "Leaderboard", url: "/dashboard/leaderboard", icon: Trophy },
  { title: "Routes", url: "/dashboard/routes", icon: Route },
  { title: "Calendar", url: "/dashboard/calendar", icon: Calendar },
  { title: "Pricing", url: "/dashboard/pricing", icon: DollarSign },
  { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Roles", url: "/dashboard/roles", icon: ShieldCheck },
  { title: "Organization", url: "/dashboard/organization", icon: Building2 },
  { title: "GBP Reviews", url: "/dashboard/gbp", icon: Star },
];

const techNav = [
  { title: "My Jobs", url: "/dashboard", icon: CalendarDays, end: true },
  { title: "My Route", url: "/dashboard/my-route", icon: Route },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

function AppSidebarContent() {
  const { signOut } = useAuth();
  const { role, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { setOpenMobile, isMobile } = useSidebar();

  const items = isAdmin ? adminNav : techNav;
  const roleLabel = isAdmin ? "Admin" : "Technician";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
        <Leaf className="h-6 w-6 text-primary shrink-0" />
        <span className="font-display font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">
          DukeOS
        </span>
        <Badge variant="secondary" className="text-xs group-data-[collapsible=icon]:hidden">
          {roleLabel}
        </Badge>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto">
        <ReleaseTracker />
        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-sidebar-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
          </Button>
        </div>
      </div>
    </Sidebar>
  );
}

function OSBreadcrumbs() {
  const location = useLocation();
  const { isAdmin } = useUserRole();
  const items = isAdmin ? adminNav : techNav;

  const segments = location.pathname.replace(/^\/dashboard\/?/, "").split("/").filter(Boolean);
  const currentItem = segments.length === 0
    ? items.find((i) => i.end)
    : items.find((i) => i.url === `/dashboard/${segments[0]}`);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {segments.length === 0 ? (
            <BreadcrumbPage>{currentItem?.title ?? "Dashboard"}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {segments.length > 0 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentItem?.title ?? segments[0]}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

const OSLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebarContent />
        <main className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md px-4 sticky top-0 z-40">
            <SidebarTrigger />
            <div className="h-5 w-px bg-border" />
            <OSBreadcrumbs />
            <div className="ml-auto flex items-center gap-2">
              <OfflineIndicator />
              <PushNotificationToggle />
              <ThemeToggle />
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono text-muted-foreground border-border/60">
                v1.0.2
              </Badge>
            </div>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default OSLayout;
