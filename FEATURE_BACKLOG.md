# DukeOS Feature Backlog & Sprint Roadmap

**Version:** 3.0 (Geospatial Quoting Update)
**Date:** February 27, 2026
**Status:** ✅ All PRD 3.0 Features Implemented

---

## ✅ Sprint 1: Growth & Critical Fixes (P0) — COMPLETE

| ID | Priority | Feature | Status |
|---|---|---|---|
| **GRO-01** | **P0** | **Public Booking Widget** | ✅ `/quote` page with zip validation, dog/frequency sliders, dynamic pricing, account creation |
| **REG-01** | **P0** | **Restore Add-ons Page** | ✅ Fixed |
| **AI-01** | **P0** | **Wire Route Optimization** | ✅ OSRM Trip API integrated |

---

## ✅ Sprint 2: Marketing Automation & AI-Assisted Quoting (P1) — COMPLETE

| ID | Priority | Feature | Status |
|---|---|---|---|
| **GRO-02** | **P1** | **Google Business Profile Sync** | ✅ `/dashboard/gbp` — reviews dashboard, metrics, auto-review-request settings, template config |
| **GRO-03** | **P1** | **Geospatial Quoting Tool** | ✅ Satellite map with polygon drawing, Shoelace area calc, `yard_size_sqft` saved to service_addresses |
| **AI-02** | **P1** | **Connect Yard Watch Vision** | ✅ Gemini Flash integration |
| **AI-03** | **P1** | **Connect Gate Detection** | ✅ Gemini Flash integration |

---

## ✅ Sprint 3: Platform Maturity & Scale (P2) — COMPLETE (minus Stripe Connect)

| ID | Priority | Feature | Status |
|---|---|---|---|
| **PLAT-01** | **P2** | **Multi-Tenant Org Support** | ✅ `organizations`, `org_members` tables, RLS, `/dashboard/organization` page |
| **BILL-01** | **P2** | **Stripe Connect Integration** | ⏸️ Deferred per user request |
| **UX-01** | **P2** | **Technician Gamification** | ✅ Badge thresholds, leaderboard |

---

## ✅ PRD v3.0 Epic Implementations

| Epic | Feature | Status |
|---|---|---|
| **E11: Growth Engine** | **F11.1: Public Booking Widget** | ✅ `/quote` — 3-step wizard (zip → config → sign-up) |
| **E11: Growth Engine** | **F11.2: GBP Integration** | ✅ `/dashboard/gbp` — reviews, metrics, auto-request settings |
| **E12: Geospatial Quoting** | **F12.1: Yard Measurement** | ✅ Satellite map + polygon drawing in customer detail sheet |
| **E12: Geospatial Quoting** | **F12.2: Yard Size Pricing** | ✅ `pricing_tiers` table + admin config on Pricing page |

---

## 📦 Database Tables Added (v3.0)
- `service_areas` — zip code service area validation
- `gbp_integrations` — Google Business Profile connections
- `reviews` — GBP review sync and management
- `pricing_tiers` — yard size pricing surcharges
- `service_addresses.yard_size_sqft` — geospatial measurement storage

---

## 📉 Known Issues / Bugs
- **BUG-002:** Map pins sometimes overlap in high-density clusters.
- ~~**BUG-001:** "Optimize Route" button shows placeholder dashes.~~ FIXED
- ~~**BUG-003:** Login screen copy says "Lawn Care" instead of "Pet Services".~~ FIXED
