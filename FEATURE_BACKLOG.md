# DukeOS Feature Backlog & Sprint Roadmap

**Version:** 1.0.0 (Sprint 3 Complete — minus Stripe)
**Date:** February 27, 2026
**Status:** Active Development

---

## ✅ Sprint 1: Critical Fixes & AI Core (P0) — COMPLETE
**Goal:** Restore broken functionality and connect the "Brain" (AI Logic) to the "Body" (UI).

| ID | Priority | Feature | Status |
|---|---|---|---|
| **REG-01** | **P0** | **Restore Add-ons Page** | ✅ Done — Tab renders service catalog with ordering |
| **AI-01** | **P0** | **Wire Route Optimization** | ✅ Done — OSRM Trip API connected, polyline drawn, distance/time live |
| **AI-02** | **P1** | **Connect Yard Watch Vision** | ✅ Done — Gemini Flash via Lovable AI gateway, auto-detect + upsell SMS |
| **AI-03** | **P1** | **Connect Gate Detection** | ✅ Done — Gemini Flash via Lovable AI gateway, admin alerts on failure |
| **UX-01** | **P2** | **Technician Filter** | ✅ Done — Customers page excludes technician-role users |
| **BUILD** | **P0** | **Fix Edge Function Type Errors** | ✅ Done — All 9 TS errors resolved |

---

## ✅ Sprint 2: Scale & Gamification (P1) — COMPLETE
**Goal:** Enhance the "Stickiness" for technicians and "Visibility" for owners.

| ID | Priority | Feature | Status |
|---|---|---|---|
| **RPT-01** | **P1** | **Route Efficiency Metrics** | ✅ Done — Revenue/Mile, Stops/Hour, Avg Miles/Route KPI cards added |
| **NOT-01** | **P1** | **Visual Notifications** | ✅ Done — 50x50px photo thumbnails + full image modal on all tabs |
| **CRM-01** | **P2** | **Customer Drill-Down** | ✅ Done — Detail sheet with Pause/Cancel subscription controls |
| **GAM-01** | **P2** | **Badge Logic Implementation** | ✅ Done — 50 jobs = Workhorse, 0 cancellations = Perfectionist, live scoring |

---

## ✅ Sprint 3: Platform Maturity (v1.0) — COMPLETE (minus Stripe)
**Goal:** Multi-tenant readiness, push notifications, and offline mode.

| ID | Priority | Feature | Status |
|---|---|---|---|
| **ORG-01** | **P1** | **Multi-Tenant Org Support** | ✅ Done — `organizations` + `org_members` tables, `org_id` on jobs/subs/addresses, RLS isolation, admin Organization page |
| **PUSH-01** | **P1** | **Mobile Push Notifications** | ✅ Done — Push API subscription hook, toggle in header, `push_subscriptions` table |
| **OFF-01** | **P1** | **Offline Mode** | ✅ Done — localStorage queue, auto-sync on reconnect, offline Start/Complete job, OfflineIndicator badge |
| **STRIPE** | **P0** | **Stripe Connect Integration** | ⏭ Skipped — Deferred per request |

---

## 🔮 Sprint 4: Growth & Polish
**Goal:** Revenue automation, customer self-service, and analytics.

- [ ] **Stripe Connect Integration:** Split payments between Platform (SaaS Fee) and OpCo (Service Fee).
- [ ] **Customer Self-Service Portal:** Let customers pause/resume subscriptions, update payment, view receipts.
- [ ] **Advanced Analytics Dashboard:** Revenue trends, churn prediction, technician utilization heatmaps.
- [ ] **Automated Recurring Billing:** Auto-charge on subscription renewal dates.
- [ ] **White-Label Branding:** Per-org custom logos, colors, and domain.

---

## 📉 Known Issues / Bugs
- ~~**BUG-001:** "Optimize Route" button shows placeholder dashes.~~ ✅ Fixed — OSRM connected
- ~~**BUG-002:** Notifications page loader spins indefinitely on first load.~~ ✅ Fixed in v0.9.1
- **BUG-003:** Map pins sometimes overlap in high-density clusters.
- ~~**BUG-004:** Login screen copy says "Lawn Care" instead of "Pet Services".~~ ✅ Fixed — says "pet services"
