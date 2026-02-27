import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Rocket, Check, Wrench, Sparkles, Bug, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
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

/*──────────────────────────────────────────────────────────────
  RELEASE LOG — auto-updated on every publish event.
  When Lovable publishes a new version, append an entry here
  and bump the version string.  See memory: features/release-tracker.
──────────────────────────────────────────────────────────────*/
const releases: ReleaseItem[] = [
  // ── Sprint 3 / PRD 3.0 ───────────────────────────────
  { id: "r0a", title: "Hover detail cards on releases", description: "Release line-items now show a rich hover card with full description, type badge, version, and date. Works on hover and click for mobile.", type: "improvement", date: new Date("2026-02-27"), version: "1.0.1" },
  { id: "r0b", title: "GBP Reviews dashboard", description: "Admins can view Google Business Profile reviews, star ratings, and configure automatic review-request emails after completed jobs.", type: "feature", date: new Date("2026-02-27"), version: "1.0.0" },
  { id: "r0c", title: "Public booking widget", description: "Customers can get an instant quote, pick a plan, and sign up from a standalone /quote page. ZIP-code validated against service areas.", type: "feature", date: new Date("2026-02-27") },
  { id: "r0d", title: "Satellite yard measurement", description: "Admins can draw a polygon on Esri satellite imagery to measure yard area in sq ft. Measurement auto-saves to the address record.", type: "feature", date: new Date("2026-02-27") },
  { id: "r0e", title: "Yard-size pricing tiers", description: "Pricing page now supports tiered surcharges based on measured yard square footage. Admins can add, edit, and delete tiers.", type: "feature", date: new Date("2026-02-27") },
  { id: "r0f", title: "Multi-tenant org support", description: "Organizations table with RLS isolation. Admins can create an org, invite members, and scope data per org_id.", type: "feature", date: new Date("2026-02-26") },
  { id: "r0g", title: "Push notification toggle", description: "Technicians and admins can subscribe/unsubscribe to browser push notifications from the header toolbar.", type: "feature", date: new Date("2026-02-26") },
  { id: "r0h", title: "Offline job sync", description: "Technicians can start/complete jobs offline. Actions queue locally and auto-sync when connectivity resumes.", type: "feature", date: new Date("2026-02-26") },

  // ── Sprint 2 ──────────────────────────────────────────
  { id: "r1", title: "Yard Watch AI photo detection", description: "Technicians can snap a photo and AI auto-detects yard hazards like broken fences, standing water, or debris. Issues are logged and admins notified instantly.", type: "feature", date: new Date("2026-02-25"), version: "0.9.0" },
  { id: "r2", title: "Subscription management UI", description: "Customers can now view, pause, or cancel their subscriptions directly from the dashboard. Admins see all subscription changes in real time.", type: "feature", date: new Date("2026-02-25") },
  { id: "r3", title: "Manager role & permissions", description: "New manager role added between admin and technician. Managers can view reports, manage crew schedules, but cannot change billing or roles.", type: "feature", date: new Date("2026-02-25") },
  { id: "r4", title: "Customer email column", description: "Admin customer table now shows email addresses pulled from auth profiles for quicker lookups and contact.", type: "improvement", date: new Date("2026-02-24") },
  { id: "r5", title: "Auto-schedule button", description: "One-click auto-scheduling assigns technicians to unassigned jobs based on availability, location density, and skill match.", type: "feature", date: new Date("2026-02-23"), version: "0.8.0" },
  { id: "r6", title: "Route optimization (OSRM)", description: "Routes page uses OSRM Trip API to reorder stops for shortest drive time. Displays polyline overlay, total distance, and estimated duration.", type: "feature", date: new Date("2026-02-21") },
  { id: "r7", title: "Gate latch AI verification", description: "After-photos are analyzed by Gemini Vision to verify gate latches are secure. Failed checks trigger admin alerts with confidence scores.", type: "feature", date: new Date("2026-02-20") },
  { id: "r8", title: "Leaderboard page", description: "Ranks technicians by jobs completed, on-time rate, and customer ratings. Gamifies performance tracking for the crew.", type: "feature", date: subWeeks(new Date("2026-02-27"), 1) },
  { id: "r9", title: "Add-ons marketplace", description: "Customers can browse and purchase service add-ons like deodorizing or sanitizing. Orders attach to their next scheduled job.", type: "feature", date: subWeeks(new Date("2026-02-27"), 2), version: "0.7.0" },
  { id: "r10", title: "Live ETA tracker", description: "Customers see real-time technician location on a map with estimated arrival time, powered by live GPS tracking.", type: "feature", date: subWeeks(new Date("2026-02-27"), 2) },
  { id: "r11", title: "Booking wizard", description: "Step-by-step onboarding flow: select plan, add address, choose frequency, and confirm. Reduces signup friction significantly.", type: "feature", date: subMonths(new Date("2026-02-27"), 1), version: "0.6.0" },
  { id: "r12", title: "Weather alerts system", description: "Automated weather monitoring flags severe conditions by ZIP code. Affected jobs can be auto-rescheduled to avoid cancellations.", type: "feature", date: subMonths(new Date("2026-02-27"), 1) },
  { id: "r13", title: "Role-based dashboards", description: "Separate dashboard experiences for admins, technicians, and customers. Each role sees only what's relevant to them.", type: "feature", date: subMonths(new Date("2026-02-27"), 2), version: "0.5.0" },
  { id: "r14", title: "Auth & protected routes", description: "Email/password authentication with role-based route protection. Unauthorized users are redirected to login automatically.", type: "feature", date: subMonths(new Date("2026-02-27"), 3), version: "0.4.0" },
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
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button className="w-full flex items-start gap-2 py-1.5 group/row text-left rounded-md px-1.5 -mx-1.5 hover:bg-sidebar-accent/60 transition-colors cursor-pointer">
          <div className="mt-0.5 shrink-0">
            <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover/row:text-foreground transition-colors" />
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
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-72 p-0 overflow-hidden" sideOffset={12}>
        {/* Header bar with type color */}
        <div className={cn("px-3 py-2 border-b border-border/60 flex items-center gap-2", config.className.replace(/border-\S+/g, ""))}>
          <Icon className="h-4 w-4 shrink-0" />
          <span className="text-xs font-semibold truncate flex-1">{item.title}</span>
          {item.version && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono shrink-0">
              v{item.version}
            </Badge>
          )}
        </div>
        {/* Body */}
        <div className="px-3 py-3 space-y-2.5">
          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-4 font-normal", config.className)}>
              {config.label}
            </Badge>
            <span className="text-[10px] text-muted-foreground ml-auto">{format(item.date, "MMM d, yyyy")}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
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
