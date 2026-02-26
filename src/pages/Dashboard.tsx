import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, MapPin, CalendarDays, CreditCard, LogOut, Menu, X, User, Plus, Sparkles, FileText } from "lucide-react";
import ThemeToggle from "@/components/layout/ThemeToggle";
import SubscriptionsTab from "@/components/dashboard/SubscriptionsTab";
import AddressesTab from "@/components/dashboard/AddressesTab";
import JobsTab from "@/components/dashboard/JobsTab";
import ProfileTab from "@/components/dashboard/ProfileTab";
import AddonsTab from "@/components/dashboard/AddonsTab";
import YardHealthTab from "@/components/dashboard/YardHealthTab";
import LiveETATracker from "@/components/dashboard/LiveETATracker";
import BookingWizard from "@/components/booking/BookingWizard";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "jobs", label: "Upcoming Jobs", icon: CalendarDays },
  { id: "book", label: "Book Service", icon: Plus },
  { id: "addons", label: "Add-ons", icon: Sparkles },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "yard-health", label: "Yard Health", icon: FileText },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "profile", label: "Profile", icon: User },
] as const;

type TabId = (typeof tabs)[number]["id"];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  
  // Check if customer has any subscriptions
  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["my-subscriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("customer_id", user!.id)
        .limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isNewCustomer = !subsLoading && (!subscriptions || subscriptions.length === 0);
  const [activeTab, setActiveTab] = useState<TabId>(isNewCustomer ? "book" : "jobs");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">DukeOS</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.email}
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-2 space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="w-full justify-start gap-2"
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        )}
      </header>

      <main className="container px-4 py-8 space-y-6">
        {/* Live ETA banner always visible when tech is en route */}
        <LiveETATracker />

        {activeTab === "jobs" && <JobsTab />}
        {activeTab === "book" && <BookingWizard onComplete={() => setActiveTab("subscriptions")} />}
        {activeTab === "addons" && <AddonsTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "yard-health" && <YardHealthTab />}
        {activeTab === "addresses" && <AddressesTab />}
        {activeTab === "profile" && <ProfileTab />}
      </main>
    </div>
  );
};

export default Dashboard;
