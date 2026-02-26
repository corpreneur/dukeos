import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Rocket, Check, Wrench, Sparkles, Bug, ChevronUp, ChevronDown } from "lucide-react";
import { format, subDays, subWeeks, subMonths, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

type ReleaseType = "feature" | "fix" | "improvement";

interface ReleaseItem {
  id: string;
  title: string;
  description: string;
  type: ReleaseType;
  date: Date;
  version?: string;
}

const typeConfig: Record<ReleaseType, { icon: typeof Sparkles; label: string; className: string }> = {
  feature: { icon: Sparkles, label: "Feature", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400" },
  fix: { icon: Bug, label: "Fix", className: "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400" },
  improvement: { icon: Wrench, label: "Improve", className: "bg-sky-500/10 text-sky-600 border-sky-500/25 dark:text-sky-400" },
};

const releases: ReleaseItem[] = [
  { id: "r1", title: "Yard Watch AI photo detection", description: "Technicians can snap a photo and AI auto-detects yard hazards like broken fences, standing water, or debris. Issues are logged and admins notified instantly.", type: "feature", date: subDays(new Date(), 0), version: "0.9.0" },
  { id: "r2", title: "Subscription management UI", description: "Customers can now view, pause, or cancel their subscriptions directly from the dashboard. Admins see all subscription changes in real time.", type: "feature", date: subDays(new Date(), 0) },
  { id: "r3", title: "Manager role & permissions", description: "New manager role added between admin and technician. Managers can view reports, manage crew schedules, but cannot change billing or roles.", type: "feature", date: subDays(new Date(), 0) },
  { id: "r4", title: "Customer email column", description: "Admin customer table now shows email addresses pulled from auth profiles for quicker lookups and contact.", type: "improvement", date: subDays(new Date(), 1) },
  { id: "r5", title: "Auto-schedule button", description: "One-click auto-scheduling assigns technicians to unassigned jobs based on availability, location density, and skill match.", type: "feature", date: subDays(new Date(), 2), version: "0.8.0" },
  { id: "r6", title: "Route optimization (OSRM)", description: "Routes page uses OSRM Trip API to reorder stops for shortest drive time. Displays polyline overlay, total distance, and estimated duration.", type: "feature", date: subDays(new Date(), 4) },
  { id: "r7", title: "Gate latch AI verification", description: "After-photos are analyzed by Gemini Vision to verify gate latches are secure. Failed checks trigger admin alerts with confidence scores.", type: "feature", date: subDays(new Date(), 5) },
  { id: "r8", title: "Leaderboard page", description: "Ranks technicians by jobs completed, on-time rate, and customer ratings. Gamifies performance tracking for the crew.", type: "feature", date: subWeeks(new Date(), 1) },
  { id: "r9", title: "Add-ons marketplace", description: "Customers can browse and purchase service add-ons like deodorizing or sanitizing. Orders attach to their next scheduled job.", type: "feature", date: subWeeks(new Date(), 2), version: "0.7.0" },
  { id: "r10", title: "Live ETA tracker", description: "Customers see real-time technician location on a map with estimated arrival time, powered by live GPS tracking.", type: "feature", date: subWeeks(new Date(), 2) },
  { id: "r11", title: "Booking wizard", description: "Step-by-step onboarding flow: select plan, add address, choose frequency, and confirm. Reduces signup friction significantly.", type: "feature", date: subMonths(new Date(), 1), version: "0.6.0" },
  { id: "r12", title: "Weather alerts system", description: "Automated weather monitoring flags severe conditions by ZIP code. Affected jobs can be auto-rescheduled to avoid cancellations.", type: "feature", date: subMonths(new Date(), 1) },
  { id: "r13", title: "Role-based dashboards", description: "Separate dashboard experiences for admins, technicians, and customers. Each role sees only what's relevant to them.", type: "feature", date: subMonths(new Date(), 2), version: "0.5.0" },
  { id: "r14", title: "Auth & protected routes", description: "Email/password authentication with role-based route protection. Unauthorized users are redirected to login automatically.", type: "feature", date: subMonths(new Date(), 3), version: "0.4.0" },
];

function filterReleases(period: string) {
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case "daily": cutoff = subDays(now, 1); break;
    case "weekly": cutoff = subWeeks(now, 1); break;
    case "monthly": cutoff = subMonths(now, 1); break;
    default: cutoff = subDays(now, 1);
  }
  return releases.filter((r) => isAfter(r.date, cutoff));
}

function ReleaseItemRow({ item }: { item: ReleaseItem }) {
  const config = typeConfig[item.type];
  const Icon = config.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full flex items-start gap-2 py-1.5 group text-left rounded-md px-1.5 -mx-1.5 hover:bg-sidebar-accent/60 transition-colors cursor-pointer">
          <div className="mt-0.5 shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs leading-tight text-sidebar-foreground truncate">{item.title}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", config.className)}>
                {config.label}
              </Badge>
              {item.version && (
                <span className="text-[10px] text-muted-foreground font-mono">{item.version}</span>
              )}
              <span className="text-[10px] text-muted-foreground ml-auto">{format(item.date, "MMM d")}</span>
            </div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-64 p-0 overflow-hidden" sideOffset={12}>
        <div className={cn("px-3 py-2 border-b border-border flex items-center gap-2", config.className.replace(/border-\S+/g, ""))}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold truncate">{item.title}</span>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          <div className="flex items-center gap-2 pt-1 border-t border-border/50">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", config.className)}>
              {config.label}
            </Badge>
            {item.version && (
              <span className="text-[10px] font-mono text-muted-foreground">{item.version}</span>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">{format(item.date, "MMM d, yyyy")}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ReleaseTracker() {
  const [expanded, setExpanded] = useState(false);
  const [period, setPeriod] = useState("weekly");

  const filtered = filterReleases(period);
  const latestVersion = releases.find((r) => r.version)?.version ?? "0.0.0";

  return (
    <div className="border-t border-sidebar-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-sidebar-accent/50 transition-colors"
      >
        <Rocket className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-sidebar-foreground group-data-[collapsible=icon]:hidden flex-1">
          Releases
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 group-data-[collapsible=icon]:hidden">
          v{latestVersion}
        </Badge>
        {expanded ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        ) : (
          <ChevronUp className="h-3 w-3 text-muted-foreground group-data-[collapsible=icon]:hidden" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 group-data-[collapsible=icon]:hidden">
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList className="w-full h-7 mb-2">
              <TabsTrigger value="daily" className="text-[10px] h-5 flex-1">Today</TabsTrigger>
              <TabsTrigger value="weekly" className="text-[10px] h-5 flex-1">Week</TabsTrigger>
              <TabsTrigger value="monthly" className="text-[10px] h-5 flex-1">Month</TabsTrigger>
            </TabsList>
          </Tabs>

          <ScrollArea className="max-h-48">
            {filtered.length === 0 ? (
              <div className="flex items-center gap-2 py-3 justify-center">
                <Check className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">No releases this period</span>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((item) => (
                  <ReleaseItemRow key={item.id} item={item} />
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="mt-2 pt-2 border-t border-sidebar-border/50 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {filtered.length} release{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-1">
              {(["feature", "fix", "improvement"] as ReleaseType[]).map((type) => {
                const count = filtered.filter((r) => r.type === type).length;
                if (count === 0) return null;
                const cfg = typeConfig[type];
                return (
                  <Badge key={type} variant="outline" className={cn("text-[10px] px-1 py-0 h-4", cfg.className)}>
                    {count} {cfg.label.toLowerCase()}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
