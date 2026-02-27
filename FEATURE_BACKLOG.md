# DukeOS Feature Backlog & Sprint Roadmap

**Version:** 0.9.3 (Sprint 2 Complete)
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

## 🔮 Sprint 3: Platform Maturity (v1.0)
**Goal:** Multi-tenant readiness and billing automation.

- [ ] **Stripe Connect Integration:** Split payments between Platform (SaaS Fee) and OpCo (Service Fee).
- [ ] **Multi-Tenant Org Support:** Ensure data isolation between different franchise owners.
- [ ] **Mobile Push Notifications:** Replace in-app alerts with real Push API for technicians.
- [ ] **Offline Mode:** Enable "Start/Stop Job" functionality without cell service.

---

## 📉 Known Issues / Bugs
- ~~**BUG-001:** "Optimize Route" button shows placeholder dashes.~~ ✅ Fixed — OSRM connected
- ~~**BUG-002:** Notifications page loader spins indefinitely on first load.~~ ✅ Fixed in v0.9.1
- **BUG-003:** Map pins sometimes overlap in high-density clusters.
- ~~**BUG-004:** Login screen copy says "Lawn Care" instead of "Pet Services".~~ ✅ Fixed — says "pet services"
