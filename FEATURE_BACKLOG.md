# DukeOS Feature Backlog & Sprint Roadmap

**Version:** 0.9.1 (Audit Baseline)
**Date:** February 26, 2026
**Status:** Active Development

---

## 🚨 Sprint 1: Critical Fixes & AI Core (P0)
**Goal:** Restore broken functionality and connect the "Brain" (AI Logic) to the "Body" (UI).

| ID | Priority | Feature | Description | Acceptance Criteria |
|---|---|---|---|---|
| **REG-01** | **P0** | **Restore Add-ons Page** | The `/dashboard/add-ons` route renders a blank white screen. This breaks the upsell workflow. | 1. Page loads with service catalog.<br>2. "Add New Service" button works.<br>3. Technicians can see these items in their app. |
| **AI-01** | **P0** | **Wire Route Optimization** | Connect the "Optimize Route" button to OSRM or Mapbox API via Edge Function. | 1. Clicking "Optimize" reorders the stop list.<br>2. Total Distance/Time updates with real values.<br>3. Map draws a polyline connecting stops. |
| **AI-02** | **P1** | **Connect Yard Watch Vision** | Integrate the `yard-watch` edge function with OpenAI Vision API. | 1. Uploading a photo triggers the edge function.<br>2. AI returns "Long Grass" or "Clean" tag.<br>3. UI suggests "Mowing Upsell" if tag is "Long Grass". |
| **AI-03** | **P1** | **Connect Gate Detection** | Integrate the `detect-gate` edge function with OpenAI Vision API. | 1. Uploading a photo triggers analysis.<br>2. AI returns "Secure" or "Unsafe" confidence score.<br>3. UI shows Green/Red badge based on score. |
| **UX-01** | **P2** | **Technician Filter** | Exclude users with `role: technician` from the Customers list view. | 1. Customers page only shows homeowners.<br>2. Crew page only shows technicians. |

---

## 🚀 Sprint 2: Scale & Gamification (P1)
**Goal:** Enhance the "Stickiness" for technicians and "Visibility" for owners.

| ID | Priority | Feature | Description | Acceptance Criteria |
|---|---|---|---|---|
| **RPT-01** | **P1** | **Route Efficiency Metrics** | Add "Revenue per Mile" and "Stops per Hour" to the Reports module. | 1. Reports page shows 2 new KPI cards.<br>2. Data aggregates from completed routes. |
| **NOT-01** | **P1** | **Visual Notifications** | Add photo thumbnails to the Notification feed for Gate/Yard alerts. | 1. Alert card shows a 50x50px thumbnail of the issue.<br>2. Clicking thumbnail opens full image modal. |
| **CRM-01** | **P2** | **Customer Drill-Down** | Build a detailed "Customer Profile" view with history and subscription controls. | 1. Clicking a row in Customers table opens detail view.<br>2. Admin can Pause/Cancel subscription from this view. |
| **GAM-01** | **P2** | **Badge Logic Implementation** | Connect the `leaderboard` table to real job completion events. | 1. Completing 50 jobs unlocks "Workhorse" badge.<br>2. 5-star rating unlocks "Perfectionist" badge. |

---

## 🔮 Sprint 3: Platform Maturity (v1.0)
**Goal:** Multi-tenant readiness and billing automation.

- [ ] **Stripe Connect Integration:** Split payments between Platform (SaaS Fee) and OpCo (Service Fee).
- [ ] **Multi-Tenant Org Support:** Ensure data isolation between different franchise owners.
- [ ] **Mobile Push Notifications:** Replace in-app alerts with real Push API for technicians.
- [ ] **Offline Mode:** Enable "Start/Stop Job" functionality without cell service.

---

## 📉 Known Issues / Bugs
- **BUG-001:** "Optimize Route" button shows placeholder dashes.
- **BUG-002:** Notifications page loader spins indefinitely on first load (fixed in v0.9.1, verify regression).
- **BUG-003:** Map pins sometimes overlap in high-density clusters.
- **BUG-004:** Login screen copy says "Lawn Care" instead of "Pet Services".
