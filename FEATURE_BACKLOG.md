# DukeOS Feature Backlog & Sprint Roadmap

**Version:** 2.0 (Growth Engine Update)
**Date:** February 26, 2026
**Status:** Active Development

---

## 🚨 Sprint 1: Growth & Critical Fixes (P0)
**Goal:** Launch client acquisition tools and restore core FSM functionality.

| ID | Priority | Feature | Description | Acceptance Criteria |
|---|---|---|---|---|
| **GRO-01** | **P0** | **Public Booking Widget** | Create a self-serve, embeddable widget for franchisee websites to capture new leads. | 1. Widget provides instant quotes based on address, # of dogs, and frequency.<br>2. New customers can sign up and enter payment info via Stripe.<br>3. A new `customer` and `subscription` are created and flagged for admin review. |
| **REG-01** | **P0** | **Restore Add-ons Page** | The `/dashboard/add-ons` route renders a blank white screen. This breaks the upsell workflow. | 1. Page loads with service catalog.<br>2. "Add New Service" button works.<br>3. Technicians can see these items in their app. |
| **AI-01** | **P0** | **Wire Route Optimization** | Connect the "Optimize Route" button to a routing engine (e.g., OSRM, Mapbox) via an Edge Function. | 1. Clicking "Optimize" reorders the stop list based on efficiency.<br>2. Total Distance/Time updates with real values.<br>3. Map draws a polyline connecting stops in the optimized order. |

---

## 🚀 Sprint 2: Marketing Automation & AI Vision (P1)
**Goal:** Automate marketing tasks and activate the core AI-powered visual analysis features.

| ID | Priority | Feature | Description | Acceptance Criteria |
|---|---|---|---|---|
| **GRO-02** | **P1** | **Google Business Profile Sync** | Integrate with GBP API to automate review requests and pull in performance data. | 1. Admin can connect their GBP account via OAuth.<br>2. System auto-sends review requests 24hrs after job completion.<br>3. Dashboard widget displays GBP reviews and key metrics (views, clicks, calls). |
| **AI-02** | **P1** | **Connect Yard Watch Vision** | Integrate the `yard-watch` edge function with a computer vision model to identify upsell opportunities. | 1. Uploading a service photo triggers the edge function.<br>2. AI returns relevant tags (e.g., "Long Grass", "Weeds").<br>3. UI suggests appropriate upsell service to admin/customer. |
| **AI-03** | **P1** | **Connect Gate Detection** | Integrate the `detect-gate` edge function with a computer vision model to verify property security. | 1. Uploading a departure photo triggers analysis.<br>2. AI returns "Secure" or "Unsafe" status with a confidence score.<br>3. UI shows a Green/Red badge on the job record. |

---

## 🔮 Sprint 3: Platform Maturity & Scale (P2)
**Goal:** Prepare for multi-tenancy, advanced billing, and improved technician experience.

| ID | Priority | Feature | Description | Acceptance Criteria |
|---|---|---|---|---|
| **PLAT-01** | **P2** | **Multi-Tenant Org Support** | Ensure strict data isolation between different franchise owners using RLS. | 1. An admin for Franchise A cannot see any data from Franchise B.<br>2. Queries are scoped to the user's `organization_id`. |
| **BILL-01** | **P2** | **Stripe Connect Integration** | Implement Stripe Connect to handle royalty payments and platform fees automatically. | 1. Platform can split payments between franchisee (service fee) and HoldCo (SaaS fee).<br>2. Royalty reports are generated automatically. |
| **UX-01** | **P2** | **Technician Gamification** | Implement the badge and leaderboard logic based on job performance. | 1. Completing 50 jobs unlocks "Workhorse" badge.<br>2. Maintaining a 5-star average unlocks "Perfectionist" badge.<br>3. Leaderboard updates in real-time. |

---

## 📉 Known Issues / Bugs
- **BUG-001:** "Optimize Route" button shows placeholder dashes.
- **BUG-002:** Map pins sometimes overlap in high-density clusters.
- **BUG-003:** Login screen copy says "Lawn Care" instead of "Pet Services".
