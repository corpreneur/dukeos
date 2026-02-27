# DukeOS: The Franchise Growth Platform for Pet Services

## Master Product Specification

**Version:** 3.0
**Date:** 2026-02-26
**Status:** Final, Approved for Development

---

## Part 0: Executive Summary and Strategic Mandate

**BLUF:** DukeOS v3 transitions the platform from a functional Field Service Management (FSM) tool into a **Franchise Growth Platform**. The strategic objective is to create a scalable, asset-light SaaS model that powers the Scoop Duke roll-up by providing franchisees with a structural advantage in client acquisition, quoting accuracy, and operational efficiency. This version prioritizes features that directly drive customer growth and protect gross margins, establishing a clear product-led moat against competitors like Sweep&Go.

### Chief of Staff Assessment (Capital and Risk)

The v3 feature set is designed to contain downside and create asymmetric upside. The assumptions that must hold are straightforward: franchisees need customers, and they need to price jobs accurately. The **Growth Engine** (Epic 11) reduces customer acquisition cost by automating lead capture and reputation management, converting the franchisee's website from a static brochure into a 24/7 sales channel. The **Geospatial Quoting** tool (Epic 12) directly protects gross margins by eliminating quoting errors and the operational drag of unnecessary site visits. These are not incremental improvements. They are structural to the investment thesis, transforming operational overhead into a scalable, data-driven advantage. The downside exposure is limited to development cost. The upside is a platform that makes each franchisee measurably more profitable, which is the single strongest lever for the roll-up valuation.

### Chief Business Officer Assessment (Integrated Strategy)

This PRD aligns Product, Commercial, and Platform strategy into a single coherent plan. The **Public Booking Widget** (Feature 11.1) is a commercial tool powered by the product platform, creating a seamless customer journey from first touch to conversion. The **GBP Integration** (Feature 11.2) links operational execution (job completion) directly to marketing outcomes (reviews), closing the loop between service delivery and demand generation. The **Geospatial Quoting** tool (Feature 12.1) creates a proprietary dataset of property sizes linked to service addresses, which becomes a data moat over time. The platform architecture is designed not just for current operational needs but for future commercial scale, including multi-tenancy and automated billing, which are prerequisites for the franchise model's viability. The trade-off hierarchy for this version is clear: revenue readiness over brand polish, and customer value over internal efficiency.

---

## Part 1: Epics, Features, and User Stories

### EPIC 01: User Authentication and Profile Management

> This epic covers the creation, management, and security of all user roles within the DukeOS platform. It establishes the foundation for a multi-tenant system with distinct permissions for Customers, Technicians, and Admins.

#### Feature 1.1: Role-Based User Registration and Login

*   **User Story 1.1.1:** As a `new Customer`, I want to sign up for an account using my email and password so that I can book services.
    *   **Acceptance Criteria:**
        *   **Given** a user is on the public-facing website.
        *   **When** they click "Sign Up" and enter their name, email, and a valid password.
        *   **Then** a new user record is created in the `profiles` table with the `role` of `customer`.
        *   **And** they receive a confirmation email to verify their address.
        *   **And** they are automatically logged in and redirected to their customer dashboard.

*   **User Story 1.1.2:** As a `User` (any role), I want to log in with my email and password so that I can access my role-specific dashboard.
    *   **Acceptance Criteria:**
        *   **Given** a user has a verified account.
        *   **When** they enter their correct email and password on the login page.
        *   **Then** they are authenticated and redirected to their respective dashboard (`/customer/dashboard`, `/technician/dashboard`, or `/admin/dashboard`).

*   **User Story 1.1.3:** As an `Admin`, I want to manually create a `Technician` account so that a new employee can be onboarded.
    *   **Acceptance Criteria:**
        *   **Given** an Admin is logged into the Admin Dashboard.
        *   **When** they navigate to the "Users" section and click "Add Technician".
        *   **And** they fill out the technician's name, email, and a temporary password.
        *   **Then** a new user record is created with the `role` of `technician`.
        *   **And** the technician receives an email with their login credentials and a link to set a new password.

#### Feature 1.2: Profile and Address Management (Customer)

*   **User Story 1.2.1:** As a `Customer`, I want to view and edit my personal profile information (name, phone number) so that my contact details are always up to date.
    *   **Acceptance Criteria:**
        *   **Given** a customer is logged into their dashboard.
        *   **When** they navigate to the "Profile" section.
        *   **Then** they see their current name and phone number.
        *   **And** they can edit these fields and save the changes, which are reflected in the `profiles` table.

*   **User Story 1.2.2:** As a `Customer`, I want to add, edit, and delete multiple service addresses so that I can manage service for different properties (e.g., home, rental property).
    *   **Acceptance Criteria:**
        *   **Given** a customer is in their dashboard.
        *   **When** they navigate to the "My Properties" section.
        *   **Then** they can add a new address (street, city, state, zip, notes for access).
        *   **And** the address is saved to the `service_addresses` table, linked to their `user_id`.
        *   **And** they can select a primary address and edit or delete existing ones.

---

### EPIC 02: Service Booking and Scheduling (Customer Portal)

> This epic covers the core customer-facing workflow for discovering services, getting a price, and booking a one-time or recurring job.

#### Feature 2.1: Service and Frequency Selection

*   **User Story 2.1.1:** As a `Customer`, I want to select a service address and choose a service type (e.g., "Weekly Poop Scooping") so that I can begin the booking process.
    *   **Acceptance Criteria:**
        *   **Given** a customer is on the "Book Now" page.
        *   **When** they select one of their saved `service_addresses`.
        *   **And** they are presented with a list of available services (e.g., "Pet Waste Removal").
        *   **Then** they can select a service to proceed.

*   **User Story 2.1.2:** As a `Customer`, I want to choose the number of dogs and the service frequency (e.g., "Once a Week", "Twice a Week", "One-Time Cleanup") so that I can get an accurate price quote.
    *   **Acceptance Criteria:**
        *   **Given** a customer has selected a service and address.
        *   **When** they select the number of dogs from a dropdown (1, 2, 3, 4+).
        *   **And** they select a frequency from a list of options.
        *   **Then** the system calculates and displays a dynamic price based on `pricing_rules`.

#### Feature 2.2: Checkout and Payment

*   **User Story 2.2.1:** As a `Customer`, I want to enter my credit card information securely and complete the booking so that my service is confirmed.
    *   **Acceptance Criteria:**
        *   **Given** a customer has reviewed their service details and price.
        *   **When** they proceed to checkout.
        *   **Then** a Stripe payment element is displayed.
        *   **And** they can enter their card details, which are tokenized by Stripe.
        *   **And** upon successful payment, a `subscriptions` record (for recurring) or a `jobs` record (for one-time) is created.
        *   **And** they are redirected to a confirmation page showing their service start date.

---

### EPIC 03: Technician Mobile App and Job Execution

> This epic covers the core mobile-first experience for technicians in the field. It is designed for at-a-glance clarity and minimal-click workflows.

#### Feature 3.1: Daily Route View and Navigation

*   **User Story 3.1.1:** As a `Technician`, I want to see my assigned jobs for the day in a list, ordered by the optimized route, so I know where to go next.
    *   **Acceptance Criteria:**
        *   **Given** a technician is logged into the mobile app.
        *   **When** they land on their dashboard.
        *   **Then** they see a list of `jobs` for the current day, sorted by the `route_sequence` number.
        *   **And** each job card displays the customer name, address, and service type.

*   **User Story 3.1.2:** As a `Technician`, I want to tap on a job and get driving directions via my phone's default maps app (Google Maps/Apple Maps) so I can navigate to the location efficiently.
    *   **Acceptance Criteria:**
        *   **Given** a technician is viewing their daily route.
        *   **When** they tap the "Navigate" button on a job card.
        *   **Then** their phone's native mapping application opens with the `service_address` pre-filled as the destination.

#### Feature 3.2: Job Workflow (Start, Proof of Scoop, Complete)

*   **User Story 3.2.1:** As a `Technician`, I want to start a job timer when I arrive at a property so that the system tracks my service duration.
    *   **Acceptance Criteria:**
        *   **Given** a technician is at a customer's property.
        *   **When** they open the job details and tap "Start Job".
        *   **Then** the `jobs` table `started_at` timestamp is populated.

*   **User Story 3.2.2:** As a `Technician`, I must take a photo of the closed and latched gate upon departure so that the company has a visual record of securing the property.
    *   **Acceptance Criteria:**
        *   **Given** a technician has completed the service.
        *   **When** they tap "Complete Job".
        *   **Then** the app opens the phone's camera.
        *   **And** they must take a photo, which is uploaded to a secure bucket and linked to the `job_id` in the `job_proofs` table with the type `gate_photo`.
        *   **And** the job cannot be marked as complete until the photo is successfully uploaded.

---

### EPIC 04: Admin Dashboard - Operations Management

> This epic provides the central nervous system for the business, allowing admins to manage customers, jobs, routes, and technicians.

#### Feature 4.1: Customer and Job Management

*   **User Story 4.1.1:** As an `Admin`, I want to view a list of all customers and search for them by name or email so I can quickly access their profiles and service history.

*   **User Story 4.1.2:** As an `Admin`, I want to view all jobs (upcoming, in-progress, completed) and filter them by date, technician, or status so I can monitor daily operations.

#### Feature 4.2: Manual Route Building and Assignment

*   **User Story 4.2.1:** As an `Admin`, I want to see all unassigned jobs for a specific day on a map so I can visually group them into routes.

*   **User Story 4.2.2:** As an `Admin`, I want to create a new route, assign a technician to it, and drag-and-drop unassigned jobs into it to build a daily schedule.

---

### EPIC 05: AI - Autonomous Route Density Optimization

> This is the core IP of DukeOS. It moves routing from a manual drag-and-drop process to an automated, profit-maximized one.

#### Feature 5.1: Density-Based Scoring and Dynamic Pricing

*   **User Story 5.1.1:** As the `System`, when a new customer requests a quote, I want to calculate a "Density Score" based on the proximity of their `service_address` to existing customer routes so that I can apply a dynamic pricing model.

*   **User Story 5.1.2:** As an `Admin`, I want to configure the rules for the dynamic pricing engine (e.g., "if Density Score > 80, apply 15% discount") so I can control the trade-off between growth and margin.

#### Feature 5.2: Automated Route Generation

*   **User Story 5.2.1:** As an `Admin`, I want to press a "Generate Routes for Tomorrow" button that uses an algorithm (e.g., Traveling Salesperson Problem solver) to automatically create the most efficient routes for all scheduled jobs and assign them to available technicians.

---

### EPIC 06: AI - "Proof of Scoop" Visual QA

> This epic expands the simple photo upload into a true visual verification system, reducing liability and disputes.

*   **User Story 6.1.1:** As the `System`, when a `gate_photo` is uploaded, I want to run it through a computer vision model to verify that a) a gate is present and b) the latch is in the "closed" position.

*   **User Story 6.1.2:** As an `Admin`, I want to be alerted if a technician uploads a `gate_photo` that fails the AI verification so I can immediately contact the technician to resolve the issue.

---

### EPIC 07: AI - "Yard Watch" Automated Upsell Agent

> This epic transforms technicians from cost centers into revenue generators by creating a frictionless upsell workflow.

*   **User Story 7.1.1:** As a `Technician`, I want to be able to tap a "Report Issue" button during a job and select from a predefined list of common yard problems (e.g., "Long Grass", "Broken Sprinkler", "Pest Infestation") and optionally add a photo.

*   **User Story 7.1.2:** As the `System`, when a technician reports a "Long Grass" issue, I want to automatically trigger a pre-approved SMS to the customer offering a one-time lawn mow service on their next scheduled visit.

---

### EPIC 08: Billing and Invoicing

> This epic handles the automated collection of payments for recurring subscriptions and one-time jobs.

*   **User Story 8.1.1:** As the `System`, I want to automatically charge the customer's saved payment method on the first day of each month for their recurring subscription.

*   **User Story 8.1.2:** As a `Customer`, I want to view my billing history and download PDF invoices for my records.

---

### EPIC 09: Notifications

> This epic keeps all user roles informed of important events.

*   **User Story 9.1.1:** As a `Customer`, I want to receive an SMS notification when my technician is on their way to my property.

*   **User Story 9.1.2:** As a `Technician`, I want to receive a push notification when a new job is assigned to my route for the current day.

---

### EPIC 10: Reporting and Analytics (Admin)

> This epic provides admins with the key metrics to understand business performance.

*   **User Story 10.1.1:** As an `Admin`, I want to see a dashboard with KPIs such as Daily Revenue, Number of Completed Jobs, Average Jobs Per Route, and Customer Churn Rate.

---

### EPIC 11: The Growth Engine - Marketing and Client Acquisition

> **CBO Note:** This epic is the primary commercial differentiator for DukeOS v3. It directly addresses the most critical challenge for any local service business: acquiring customers profitably. By embedding marketing and sales tools directly into the operating system, DukeOS provides a structural advantage over competitors relying on manual processes or disparate, costly software. This is the feature set that justifies the "Growth Platform" positioning.

#### Feature 11.1: Automated Client Onboarding and Quoting Widget

*   **User Story 11.1.1:** As a `Potential Customer`, I want to enter my zip code on the franchisee's website to see if I am in the service area and then get an instant, configurable quote so I can sign up for service immediately.
    *   **Acceptance Criteria:**
        *   **Given** a potential customer is on the franchisee's website.
        *   **When** they enter their zip code into the initial quote modal.
        *   **Then** the system validates the zip code against the franchisee's defined service area in DukeOS.
        *   **And if** the zip is valid, the widget expands to show the full quoting interface.
        *   **And** they can use a slider to select the "Number of Dogs" (1 through 5+).
        *   **And** they can use a slider to select the "Cleanup Frequency" (Three Times A Week, Two Times A Week, Once A Week, Bi-Weekly, Twice Per Month, Once A Month, One-Time).
        *   **And** they can select from a dropdown for "Last Time Yard Was Thoroughly Cleaned" to calculate any initial cleanup fees.
        *   **And** they can enter a "Coupon Code" for promotional discounts.
        *   **Then** the widget displays an itemized, real-time price quote.
        *   **And** they can click "Get Free Quote" to proceed to a full sign-up page to create an account and enter payment details via Stripe.

*   **User Story 11.1.2:** As the `System`, when a new customer signs up through the public widget, I want to automatically create a `customer` profile, a `service_address`, and a `subscription` record, and flag the new customer for an Admin to review and assign to a route.

#### Feature 11.2: Google Business Profile (GBP) Integration

*   **User Story 11.2.1:** As a `Franchise Owner` (Admin), I want to securely connect my Google Business Profile to DukeOS so that the platform can manage reviews and track performance.
    *   **Acceptance Criteria:**
        *   **Given** an Admin is in the DukeOS settings.
        *   **When** they navigate to "Integrations" and select "Google Business Profile".
        *   **Then** they are guided through an OAuth flow to grant DukeOS permission to manage their GBP account.

*   **User Story 11.2.2:** As the `System`, 24 hours after a `job` is marked as `completed`, I want to automatically send an SMS or email to the `customer` asking them to leave a review and providing a direct link to the franchisee's GBP review form.
    *   **Acceptance Criteria:**
        *   This automation can be enabled or disabled by the Admin.
        *   The message template is customizable by the Admin.

*   **User Story 11.2.3:** As a `Franchise Owner` (Admin), I want to see all of my GBP reviews within a dedicated section of my DukeOS dashboard so I can monitor and reply to them without leaving the platform.

*   **User Story 11.2.4:** As a `Franchise Owner` (Admin), I want to see a dashboard widget displaying key GBP performance metrics (e.g., Search Views, Map Views, Clicks to Website, Phone Calls) over time.

---

### EPIC 12: AI-Assisted Geospatial Quoting

> **CoS Note:** This feature directly protects franchisee profitability. The assumption is simple: larger yards require more time and effort, and pricing must reflect that reality. Without this tool, franchisees either underquote (eroding margin) or overquote (losing the customer). The downside exposure is the development cost of the mapping integration. The upside is a proprietary dataset of property sizes linked to service addresses that becomes more valuable with every quote generated. This is a data moat.

#### Feature 12.1: Interactive Yard Measurement

*   **User Story 12.1.1:** As an `Admin`, when viewing a `service_address`, I want to see an embedded satellite map (e.g., Google Maps, Mapbox) centered on the property so I can visually inspect the yard.
    *   **Acceptance Criteria:**
        *   **Given** an Admin is on a customer's property detail page.
        *   **Then** a map component is displayed showing the satellite view of the `service_address`.

*   **User Story 12.1.2:** As an `Admin`, I want to use a polygon drawing tool on the map to trace the outline of the serviceable yard area so that I can calculate its precise square footage.
    *   **Acceptance Criteria:**
        *   **Given** an Admin is viewing the property map.
        *   **When** they activate the "Measure Yard" tool.
        *   **Then** they can click points on the map to create a polygon that outlines the scoopable area.
        *   **And** the tool displays the calculated square footage of the polygon in real-time.
        *   **And** they can save this measurement, which populates the `yard_size_sqft` field for that `service_address`.

#### Feature 12.2: Yard Size in Dynamic Pricing

*   **User Story 12.2.1:** As the `System`, I want to use `yard_size_sqft` as a core variable in the dynamic pricing engine so that quotes accurately reflect the amount of work required.
    *   **Acceptance Criteria:**
        *   **Given** an Admin has configured pricing tiers based on yard size (e.g., Small < 2,000 sqft, Medium < 5,000 sqft, Large > 5,000 sqft).
        *   **When** a quote is generated for an address with a saved `yard_size_sqft`.
        *   **Then** the price is automatically adjusted based on the corresponding tier, in addition to the number of dogs and frequency.

---

## Part 2: Database Schema (Supabase/PostgreSQL)

> This SQL script defines the complete database structure for DukeOS. It includes tables, roles, and Row Level Security (RLS) policies for a secure, multi-tenant architecture. The v3 additions for the Growth Engine and Geospatial Quoting are included inline.

```sql
-- DukeOS Database Schema v3.0
-- Platform: Supabase (PostgreSQL)

-- Custom Types
CREATE TYPE user_role AS ENUM ('admin', 'technician', 'customer');
CREATE TYPE job_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE proof_type AS ENUM ('gate_photo', 'service_photo', 'issue_photo');

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Service Addresses Table (v3: added yard_size_sqft)
CREATE TABLE service_addresses (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  access_notes TEXT,
  is_primary BOOLEAN DEFAULT false,
  yard_size_sqft INT,  -- v3: Geospatial Quoting
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Subscriptions Table
CREATE TABLE subscriptions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_id BIGINT NOT NULL REFERENCES service_addresses(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  frequency TEXT NOT NULL,
  num_dogs INT NOT NULL,
  monthly_price_cents INT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Jobs Table
CREATE TABLE jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  subscription_id BIGINT REFERENCES subscriptions(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address_id BIGINT NOT NULL REFERENCES service_addresses(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status job_status NOT NULL DEFAULT 'scheduled',
  route_sequence INT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  price_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Job Proofs Table
CREATE TABLE job_proofs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_type proof_type NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. GBP Integration Table (v3: Growth Engine)
CREATE TABLE gbp_integration (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gbp_location_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Reviews Table (v3: Growth Engine)
CREATE TABLE reviews (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  gbp_integration_id BIGINT NOT NULL REFERENCES gbp_integration(id) ON DELETE CASCADE,
  review_id TEXT UNIQUE NOT NULL,
  reviewer_name TEXT,
  star_rating INT NOT NULL,
  comment TEXT,
  reply TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- RLS Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gbp_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "allow_admins_full_access" ON profiles FOR ALL USING (get_my_claim('user_role')::text = 'admin');

-- Technician: own profile and assigned jobs
CREATE POLICY "allow_technicians_to_see_own_profile" ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "allow_technicians_to_see_assigned_jobs" ON jobs FOR SELECT USING (technician_id = auth.uid());

-- Customer: own data
CREATE POLICY "allow_customers_to_manage_own_data" ON profiles FOR ALL USING (id = auth.uid());
CREATE POLICY "allow_customers_to_manage_own_addresses" ON service_addresses FOR ALL USING (user_id = auth.uid());

-- GBP: admin-only
CREATE POLICY "allow_admins_to_manage_gbp" ON gbp_integration FOR ALL USING (get_my_claim('user_role')::text = 'admin' AND user_id = auth.uid());
CREATE POLICY "allow_admins_to_manage_reviews" ON reviews FOR ALL USING (get_my_claim('user_role')::text = 'admin');
```

---

## Part 3: Lovable.dev System Prompts

> This section contains the master prompt to be pasted into Lovable to bootstrap the entire application. It defines the stack, UI component library, and core architectural principles.

### Master System Prompt for Lovable.dev

```
You are an expert full-stack software engineer specializing in rapid application development with the T3 stack. Your task is to build a multi-tenant SaaS platform for a pet services company called "DukeOS".

**Core Stack:**
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Authentication:** Supabase Auth
- **Payments:** Stripe
- **Mapping:** Mapbox GL JS (for Geospatial Quoting and Route Visualization)

**Architectural Principles:**
1.  **Multi-Tenant Roles:** The application must support three distinct user roles: `customer`, `technician`, and `admin`. Use Supabase custom claims to manage roles and implement Row Level Security (RLS) to enforce data access policies.
2.  **Dashboard Layouts:** Create a separate dashboard layout for each user role. Use Next.js route groups to structure the application: `/(customer)/dashboard`, `/(technician)/dashboard`, `/(admin)/dashboard`.
3.  **Database Schema:** Use the provided SQL schema to create all necessary tables in Supabase. Ensure all foreign key relationships and RLS policies are implemented correctly.
4.  **UI/UX:** The UI should be clean, modern, and responsive, built exclusively with shadcn/ui components. The primary brand colors are Turquoise (#0CC0DF) and Cobalt Blue (#0A2C6F).

**Initial Task:**

1.  **Set up the Next.js project.**
2.  **Integrate Supabase** for database and authentication.
3.  **Install and configure Tailwind CSS and shadcn/ui.**
4.  **Implement the User Authentication flow** (Sign Up, Login, Logout) based on EPIC 01.
5.  **Build the three dashboard layouts** (Customer, Technician, Admin) with basic navigation sidebars.
6.  **Implement the Customer Profile and Address Management** features from EPIC 01.

Begin by generating the database schema in Supabase, then proceed to build the authentication and dashboard layouts.
```

---

## Part 4: Lovable Execution Sequence (Copy-Paste Prompts)

> The following prompts are designed to be fed into Lovable.dev sequentially. Each prompt builds on the previous one. Copy-paste them one at a time, wait for Lovable to generate the code, review, and then proceed to the next.

### Prompt 1: Project Bootstrap and Auth

```
Create a new Next.js project with TypeScript, Tailwind CSS, and shadcn/ui.

Integrate Supabase for authentication and database.

Implement a full authentication flow:
- A public landing page at "/" with a hero section, "Sign Up" and "Log In" buttons.
- A "/signup" page with fields for Full Name, Email, and Password. On successful signup, create a record in the "profiles" table with role "customer".
- A "/login" page with Email and Password fields.
- After login, redirect users based on their role: customers to "/customer/dashboard", technicians to "/technician/dashboard", admins to "/admin/dashboard".
- Use Supabase Auth for all authentication logic.

Brand colors: Primary Turquoise #0CC0DF, Secondary Cobalt #0A2C6F, Background White #FFFFFF.
```

### Prompt 2: Customer Dashboard and Address Management

```
Build the Customer Dashboard layout at "/customer/dashboard".

It should have a sidebar navigation with links to: Dashboard, My Properties, Book Service, Billing, and Profile.

Implement the "My Properties" page:
- Display a list of the customer's saved service addresses from the "service_addresses" table.
- Include an "Add Property" button that opens a modal/dialog with fields: Street, City, State, Zip Code, Access Notes.
- Each address card should have "Edit" and "Delete" buttons.
- One address can be marked as "Primary".

Implement the "Profile" page:
- Display the customer's Full Name and Phone Number from the "profiles" table.
- Allow inline editing and saving of these fields.
```

### Prompt 3: Service Booking Flow

```
Build the "Book Service" page for customers.

This is a multi-step form (wizard):

Step 1: Select a saved service address from a dropdown.
Step 2: Select a service type. For MVP, the only option is "Pet Waste Removal".
Step 3: Select the number of dogs (1, 2, 3, 4+) and the frequency ("Once a Week" at $21.50/visit, "Twice a Week" at $18.00/visit, "One-Time Cleanup" at $75.00).
Step 4: Display a summary of the selected options and the calculated monthly price. Include a Stripe payment element for credit card entry.
Step 5: On successful payment, create a record in the "subscriptions" table and redirect to a confirmation page.

Use Stripe for payment processing. Create a Supabase Edge Function to handle the Stripe checkout session creation.
```

### Prompt 4: Technician Mobile App

```
Build the Technician Dashboard at "/technician/dashboard". This view must be optimized for mobile screens.

The main view is a "Today's Route" list:
- Query the "jobs" table for jobs assigned to the logged-in technician for today's date.
- Sort jobs by "route_sequence".
- Each job card shows: Customer Name, Address, Service Type, and a "Navigate" button.
- The "Navigate" button should open the device's native maps app with the address as the destination (use a geo: URI scheme).

Job Execution Flow:
- Tapping a job card opens a detail view.
- A "Start Job" button sets the "started_at" timestamp.
- A "Complete Job" button triggers the camera to take a photo.
- The photo is uploaded to Supabase Storage and a record is created in "job_proofs" with type "gate_photo".
- The job status is updated to "completed" and "completed_at" is set.
- The technician is returned to the route list.
```

### Prompt 5: Admin Dashboard - Operations

```
Build the Admin Dashboard at "/admin/dashboard".

Sidebar navigation: Dashboard, Customers, Jobs, Routes, Technicians, Billing, Settings.

"Customers" page:
- A searchable, sortable table of all users with role "customer".
- Clicking a row opens a detail view showing their profile, addresses, subscriptions, and job history.

"Jobs" page:
- A filterable table of all jobs. Filters: Date Range, Technician, Status.
- Each row shows: Date, Customer, Address, Technician, Status.

"Routes" page (MVP - Manual):
- A date picker to select a day.
- A split view: Left side shows unassigned jobs for that day. Right side shows created routes with assigned technicians.
- Drag-and-drop functionality to move jobs from the unassigned list into a route.
- A "Save Routes" button to persist the assignments.
```

### Prompt 6: Yard Watch Upsell Agent

```
Add a "Report Issue" feature to the Technician's job execution flow.

During an active job, add a "Report Yard Issue" button.
Tapping it opens a modal with:
- A dropdown to select the issue type: "Long Grass", "Broken Fence", "Pest Infestation", "Other".
- An optional text field for notes.
- An optional camera button to take a photo of the issue.

On submission:
- Save the report to a new "yard_issues" table (columns: id, job_id, technician_id, issue_type, notes, image_url, created_at).
- If the issue_type is "Long Grass", automatically trigger a Supabase Edge Function that sends an SMS via Twilio to the customer: "Hi [Customer Name]! Our tech noticed the grass is getting a bit long during today's scoop. Want us to add a mow to your Thursday visit for just $45? Reply YES to book."
- Log the SMS in a "notifications" table.
```

### Prompt 7: Reporting Dashboard

```
Build the Admin "Dashboard" (home) page with the following KPI cards and charts:

KPI Cards (top row):
- Total Active Customers (count of active subscriptions)
- Jobs Completed Today (count of jobs with status "completed" and today's date)
- Monthly Recurring Revenue (sum of all active subscription monthly_price_cents)
- Average Jobs Per Route (calculated metric)

Charts:
- A line chart showing "Jobs Completed Per Day" for the last 30 days.
- A bar chart showing "Revenue by Service Type" for the current month.
- A table showing "Top 5 Technicians by Jobs Completed This Week".

Use the Recharts library for all charts. All data should be fetched from Supabase.
```

### Prompt 8: Public Booking Widget (v3 Growth Engine)

```
Build a public-facing booking widget at "/quote".

This page does NOT require authentication. It is the primary client acquisition tool.

Step 1 - Zip Code Validation:
- Display a clean modal with the Scoop Duke logo and the headline "You're 30 Seconds Away From A Cleaner Yard!"
- Include a text input for "Zip Code" and a "Free Quote" button.
- On submission, validate the zip code against a configurable list of serviced zip codes stored in a "service_areas" table.
- If the zip is NOT serviced, display a message: "We don't service your area yet, but we're growing! Enter your email to be notified."
- If the zip IS serviced, proceed to Step 2.

Step 2 - Quote Configuration:
- Display the following fields:
  - Zip Code (pre-filled, read-only).
  - Coupon Code (optional text input).
  - Number of Dogs: A slider input ranging from 1 to 5+.
  - Cleanup Frequency: A slider input with options: "Three Times A Week", "Two Times A Week", "Once A Week", "Bi-Weekly", "Twice Per Month", "Once A Month", "One-Time".
  - Last Time Yard Was Thoroughly Cleaned: A dropdown with options: "Less than 1 week", "1-2 weeks", "2-4 weeks", "More than a month", "Never / Not Sure".
- Display a real-time, itemized price quote that updates dynamically as the user adjusts the sliders.
- A "Get Free Quote" button that proceeds to Step 3.

Step 3 - Sign Up and Pay:
- Collect Full Name, Email, Phone Number, and full Service Address.
- Display a Stripe payment element.
- On successful payment, create records in "profiles", "service_addresses", and "subscriptions" tables.
- Flag the new customer for admin review.
```

### Prompt 9: Geospatial Quoting Tool (v3)

```
On the Admin's Customer Detail page, add a new section called "Property Map & Yard Measurement".

This section should:
1. Display an embedded Mapbox satellite map centered on the customer's service_address.
2. Include a "Measure Yard" button that activates a polygon drawing tool on the map.
3. As the admin clicks points on the map, a polygon is drawn.
4. The area of the polygon is calculated in real-time and displayed in square feet.
5. A "Save Measurement" button stores the calculated value in the "yard_size_sqft" column of the "service_addresses" table.
6. If a measurement already exists, display the saved polygon on the map and show the saved square footage.

The yard_size_sqft value should be used as a variable in the pricing engine. Create an admin settings page where pricing tiers can be configured:
- Small (< 2,000 sqft): Base price
- Medium (2,000 - 5,000 sqft): Base price + $5/visit
- Large (> 5,000 sqft): Base price + $12/visit
```

---

## Part 5: Epic-to-Story Traceability Matrix

The following table provides a complete traceability matrix mapping every Epic to its Features and User Stories for sprint planning and backlog management.

| Epic | Feature | Story ID | Story Title | Priority | Sprint |
|---|---|---|---|---|---|
| E01: Auth and Profiles | F1.1: Role-Based Registration | S-1.1.1 | Customer Sign Up | P0 | 1 |
| E01: Auth and Profiles | F1.1: Role-Based Registration | S-1.1.2 | User Login (All Roles) | P0 | 1 |
| E01: Auth and Profiles | F1.1: Role-Based Registration | S-1.1.3 | Admin Creates Technician | P0 | 1 |
| E01: Auth and Profiles | F1.2: Profile Management | S-1.2.1 | Edit Profile Info | P1 | 1 |
| E01: Auth and Profiles | F1.2: Profile Management | S-1.2.2 | Manage Service Addresses | P0 | 1 |
| E02: Booking | F2.1: Service Selection | S-2.1.1 | Select Address and Service | P0 | 2 |
| E02: Booking | F2.1: Service Selection | S-2.1.2 | Choose Dogs and Frequency | P0 | 2 |
| E02: Booking | F2.2: Checkout | S-2.2.1 | Stripe Payment and Confirm | P0 | 2 |
| E03: Technician App | F3.1: Daily Route | S-3.1.1 | View Daily Job List | P0 | 3 |
| E03: Technician App | F3.1: Daily Route | S-3.1.2 | Navigate to Job | P0 | 3 |
| E03: Technician App | F3.2: Job Workflow | S-3.2.1 | Start Job Timer | P0 | 3 |
| E03: Technician App | F3.2: Job Workflow | S-3.2.2 | Gate Photo (Proof of Scoop) | P0 | 3 |
| E04: Admin Dashboard | F4.1: Customer Management | S-4.1.1 | View/Search Customers | P0 | 4 |
| E04: Admin Dashboard | F4.1: Customer Management | S-4.1.2 | View All Jobs | P0 | 4 |
| E04: Admin Dashboard | F4.2: Route Building | S-4.2.1 | View Unassigned Jobs on Map | P1 | 4 |
| E04: Admin Dashboard | F4.2: Route Building | S-4.2.2 | Drag-and-Drop Route Builder | P1 | 4 |
| E05: AI Routing | F5.1: Density Scoring | S-5.1.1 | Calculate Density Score | P1 | 5 |
| E05: AI Routing | F5.1: Density Scoring | S-5.1.2 | Configure Pricing Rules | P1 | 5 |
| E05: AI Routing | F5.2: Auto Route Gen | S-5.2.1 | Generate Optimized Routes | P2 | 6 |
| E06: Visual QA | F6.1: AI Gate Check | S-6.1.1 | CV Model for Latch Detection | P2 | 6 |
| E06: Visual QA | F6.1: AI Gate Check | S-6.1.2 | Admin Alert on Failed Check | P2 | 6 |
| E07: Yard Watch | F7.1: Issue Reporting | S-7.1.1 | Technician Reports Issue | P1 | 5 |
| E07: Yard Watch | F7.1: Automated Upsell | S-7.1.2 | Auto-SMS Upsell to Customer | P1 | 5 |
| E08: Billing | F8.1: Auto Billing | S-8.1.1 | Monthly Subscription Charge | P0 | 4 |
| E08: Billing | F8.1: Auto Billing | S-8.1.2 | Customer Invoice History | P1 | 4 |
| E09: Notifications | F9.1: Customer Alerts | S-9.1.1 | SMS: Technician En Route | P1 | 5 |
| E09: Notifications | F9.1: Technician Alerts | S-9.1.2 | Push: New Job Assigned | P2 | 5 |
| E10: Reporting | F10.1: Admin KPIs | S-10.1.1 | KPI Dashboard | P1 | 6 |
| **E11: Growth Engine** | **F11.1: Booking Widget** | **S-11.1.1** | **Public Quoting Widget** | **P0** | **1** |
| **E11: Growth Engine** | **F11.1: Booking Widget** | **S-11.1.2** | **Auto-Create Customer Record** | **P0** | **1** |
| **E11: Growth Engine** | **F11.2: GBP Integration** | **S-11.2.1** | **Connect GBP via OAuth** | **P1** | **2** |
| **E11: Growth Engine** | **F11.2: GBP Integration** | **S-11.2.2** | **Auto-Send Review Requests** | **P1** | **2** |
| **E11: Growth Engine** | **F11.2: GBP Integration** | **S-11.2.3** | **View/Reply to Reviews in Dashboard** | **P1** | **2** |
| **E11: Growth Engine** | **F11.2: GBP Integration** | **S-11.2.4** | **GBP Performance Metrics Widget** | **P1** | **2** |
| **E12: Geospatial Quoting** | **F12.1: Yard Measurement** | **S-12.1.1** | **Satellite Map on Property Page** | **P1** | **2** |
| **E12: Geospatial Quoting** | **F12.1: Yard Measurement** | **S-12.1.2** | **Polygon Drawing and SqFt Calc** | **P1** | **2** |
| **E12: Geospatial Quoting** | **F12.2: Yard Size Pricing** | **S-12.2.1** | **Yard Size as Pricing Variable** | **P1** | **2** |

---

## Part 6: Design System Tokens

The following design tokens should be applied globally across the application to maintain brand consistency with the Scoop Duke identity.

| Token | Value | Usage |
|---|---|---|
| `--color-primary` | `#0CC0DF` (Turquoise) | Primary buttons, links, active states |
| `--color-secondary` | `#0A2C6F` (Cobalt Blue) | Headers, navigation, dark accents |
| `--color-background` | `#FFFFFF` | Page backgrounds |
| `--color-surface` | `#F7F9FB` | Card backgrounds, input fields |
| `--color-text-primary` | `#1A1A2E` | Body text |
| `--color-text-secondary` | `#555555` | Muted text, descriptions |
| `--color-success` | `#10B981` | Success states, confirmations |
| `--color-warning` | `#F59E0B` | Warnings, pending states |
| `--color-error` | `#EF4444` | Errors, destructive actions |
| `--font-heading` | `Montserrat` | All headings (H1-H6) |
| `--font-body` | `Lato` | All body text, labels, inputs |
| `--radius-sm` | `6px` | Small elements (badges, pills) |
| `--radius-md` | `8px` | Cards, inputs |
| `--radius-lg` | `12px` | Modals, large containers |

---

**End of DukeOS Master Specification v3.0**
