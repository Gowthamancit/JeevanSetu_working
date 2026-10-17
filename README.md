# JeevanSetu — AI-Powered Thalassemia Care & Blood Donor Management Platform


JeevanSetu is a premium, high-fidelity care coordination and real-time blood donor match platform designed specifically for Thalassemia Major patients. By bridging the gap between recurring clinical transfusion requirements and available local donors in real-time, JeevanSetu helps ensure that no Thalassemia patient has to wait for critical blood access.

---

## 1. Project Overview 

Thalassemia Major patients require regular lifelong blood transfusions every 21 to 28 days to survive. In developing regions, families are often forced to source compatible donors independently on short notice under high emotional stress.

**JeevanSetu** addresses this critical health challenge through:
- **Instant Localized Matchmaking:** Automatically alerts compatible donors within specified travel radii the instant a patient raises a blood request.
- **Transfusion Integrity Tracking:** Helps patients log clinical transfusion logs, predicting upcoming due dates automatically.
- **Donor Safety Cycle Guard:** Automatically defer donors for 90 days following a completed donation, preventing premature donation logs.
- **Privacy-First Operations:** Securely masks identities, contact numbers, and locations until official matching agreements occur.

---

## 2. Product Features & Walkthrough

### 🚀 Landing Portal
- **Ambient Glowing Dark Theme:** Visually stunning dark dashboard design utilizing high-contrast typography, interactive components, and smooth hover state animations.
- **Interactive Blood Compatibility Checker:** Select a blood type to instantly visualize compatible matching donor groups and recipient groups based on biological rules.
- **Frictionless Onboarding:** Direct split registration routing patients to tailored clinical profiles and donors to logistical capability profiles.

### 🩸 Patient Dashboard
- **Transfusion Progress Tracking:** Dynamic visual cards estimating next transfusion dates based on a 21-day average interval from the patient's log history.
- **Failsafe Request Form:** Instant contact and location mapping matching Indian phone validation formats (`+91` or standard 10-digit).
- **Match Alerts Logs:** Real-time visibility into matches alerted, showing how many local compatible donors have been officially invited.

### 💖 Donor Dashboard
- **Logs & Availability Controls:** Quick toggles to set online/offline status, travel range limit (up to 100km), and travel willingness.
- **Compatible Quick Matches:** Clean feeds showing immediate regional compatible requests from hospitals.
- **Safe Donation Workflows:** Official confirmation screens logging units donated and locking down eligibility status instantly.

---

## 3. Blood Compatibility Rules

The matching engine enforces rigorous biological compatibility rules (matching both recipient and donor groups) automatically:

| Donor Blood Group | Compatible Recipient Blood Groups |
| :--- | :--- |
| **O-** | All blood groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`) |
| **O+** | `O+`, `A+`, `B+`, `AB+` |
| **A-** | `A-`, `A+`, `AB-`, `AB+` |
| **A+** | `A+`, `AB+` |
| **B-** | `B-`, `B+`, `AB-`, `AB+` |
| **B+** | `B+`, `AB+` |
| **AB-** | `AB-`, `AB+` |
| **AB+** | `AB+` only |

---

## 4. Privacy & Masking Policies

To protect vulnerable patient populations and ensure donor privacy, the platform adheres to strict data disclosure barriers:
1. **Name Masking:** Prior to an accepted donation agreement, patients and donors only see first name and last initial (e.g., `Aravind K.`).
2. **Contact Protection:** Patient phone numbers and hospital address details remain completely hidden from donors.
3. **Disclosure Trigger:** Contact details are only unlocked and visible inside the Donor Request Feed *after* the donor clicks **Accept Invitation**.
4. **Independent Toggles:** Donors can withdraw their active location listing from matches at any time by toggling availability settings.

---

## 5. Tech Stack & Architecture

JeevanSetu is built on a modern, highly performant, and reliable client-server architecture:

- **Frontend Core:** React 19, Vite, React Router DOM (v7).
- **Styling Framework:** Tailwind CSS (v4) with vanilla index.css custom variables.
- **Database Engine:** Supabase PostgreSQL with built-in pg_graphql.
- **State Management & Live Sync:** Supabase Real-Time PostgreSQL CDC channels.
- **Icons & Visuals:** Lucide React, Recharts.

---

## 6. Database Schema Design

The relational Postgres schema is designed with high data integrity constraints:

### `public.profiles`
Represents core user identities linked directly to `auth.users`.
- `id` (`uuid`, Primary Key, Foreign Key to `auth.users.id`)
- `role` (`text`, constraint: `'patient'` or `'donor'`)
- `full_name` (`text`)
- `phone` (`text`, nullable)
- `date_of_birth` (`date`, nullable)
- `blood_group` (`text`, constraint: matching 8 standard groups)
- `city` (`text`, nullable)
- `state` (`text`, nullable)
- `is_active` (`boolean`, default: `true`)
- `created_at` / `updated_at` (`timestamp with time zone`)

### `public.patient_profiles`
Maintains clinical contexts for registered patients.
- `id` (`uuid`, Primary Key, Foreign Key to `profiles.id`)
- `thalassemia_type` (`text`, constraint: `'Major'`, `'Intermedia'`, `'Minor'`, `'Not Diagnosed'`)
- `emergency_contact_name` (`text`, nullable)
- `emergency_contact_phone` (`text`, nullable)
- `treating_doctor` / `treating_hospital` / `current_medications` / `known_allergies` (`text`, nullable)
- `diagnosis_year` (`integer`, nullable)

### `public.donor_profiles`
Maintains availability and logistical preferences for donors.
- `id` (`uuid`, Primary Key, Foreign Key to `profiles.id`)
- `gender` (`text`, nullable)
- `weight_kg` (`numeric`, nullable)
- `last_donation_date` (`date`, nullable)
- `next_eligible_date` (`date`, nullable)
- `is_available` (`boolean`, default: `true`)
- `willing_to_travel` (`boolean`, default: `false`)
- `max_travel_distance_km` (`integer`, nullable)
- `medical_conditions` (`text`, nullable)
- `is_deferred` (`boolean`, default: `false`)
- `deferral_until` (`date`, nullable)
- `total_donations` (`integer`, default: `0`)
- `total_units_donated` (`numeric`, default: `0`)

### `public.blood_requests`
Primary transaction logs tracking patient blood demands.
- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `patient_id` (`uuid`, Foreign Key to `profiles.id`)
- `blood_group_needed` (`text`)
- `units_required` (`integer`)
- `hospital_name` (`text`)
- `hospital_address` (`text`, nullable)
- `hospital_city` / `hospital_state` (`text`)
- `required_by_date` (`date`)
- `urgency_level` (`text`, constraint: `'Emergency'`, `'Urgent'`, `'Routine'`)
- `status` (`text`, constraint: `'Open'`, `'Donor Found'`, `'Fulfilled'`, `'Cancelled'`)
- `contact_number` (`text`, nullable)
- `additional_notes` (`text`, nullable)

### `public.donor_notifications`
Maps matches and alerts sent to donors.
- `id` (`uuid`, Primary Key, default: `gen_random_uuid()`)
- `request_id` (`uuid`, Foreign Key to `blood_requests.id`)
- `donor_id` (`uuid`, Foreign Key to `profiles.id`)
- `patient_id` (`uuid`, Foreign Key to `profiles.id`)
- `status` (`text`, constraint: `'Pending'`, `'Accepted'`, `'Declined'`, `'Fulfilled'`)
- `notified_at` / `responded_at` (`timestamp with time zone`)

### `public.donations`
Maintains legal verified history of logged donations.
- `id` (`uuid`, Primary Key)
- `donor_id` / `patient_id` / `request_id` (`uuid`, Foreign Keys)
- `donation_date` (`date`)
- `units_donated` (`numeric`)
- `status` (`text`, default: `'Completed'`)

---

## 7. Security Policies (RLS details)

Row-Level Security (RLS) is enabled on all tables inside the `public` schema:
1. **`profiles`:** 
   - Public read allowed to fetch names during active invites.
   - Insert and Update permitted only if the authenticated user's ID matches the profile ID.
2. **`patient_profiles` / `donor_profiles`:**
   - Write actions strictly limited to matching authenticated profile owners.
3. **`blood_requests`:**
   - Read allowed for all authenticated users (needed for donors to browse community feeds).
   - Write allowed only for patients matching `patient_id = auth.uid()`.
4. **`donor_notifications`:**
   - Select and Update restricted to assigned donors (`donor_id = auth.uid()`) and requesting patients (`patient_id = auth.uid()`).
5. **`donations` / `transfusion_history`:**
   - Read/write access strictly bound to participants matching the related user IDs.

---

## 8. Automated Database Triggers & Stored Logic

To prevent front-end bypasses and secure clinical transactions, the database uses automated Postgres Triggers:

1. **Profile Sync Trigger:**
   Whenever a user signs up via Supabase Auth, a trigger automatically extracts metadata (`role`, `full_name`, `blood_group`, `phone`, etc.) and mirrors it into the public `profiles` table.
2. **Clinical Sub-Profile Trigger:**
   Automatically inserts matching empty rows in `donor_profiles` or `patient_profiles` based on the specified role.
3. **Auto Donation Tracker Trigger:**
   When a donation is inserted into `public.donations`, a trigger automatically updates the matching `donor_profiles` row:
   - Increments `total_donations` by 1.
   - Adds units to `total_units_donated`.
   - Sets `last_donation_date` to the donation date.
   - Sets `next_eligible_date` to `donation_date + 90 days`.
4. **Fulfillment Propagation Trigger:**
   When a donor notification's status is set to `'Accepted'`, the corresponding `blood_requests` row is automatically updated to `'Donor Found'`, alerting the patient instantly.

---

## 9. Real-Time Sync Subscriptions

Real-time live updates are handled via Supabase Channel subscriptions in the client application:
1. **Donor Sidebar Notification Count:**
   `SidebarLayout.jsx` subscribes to the `donor_notifications` table where `donor_id = auth.uid()` and status is `'Pending'`. Any new notification immediately increments the sidebar requests count badge.
2. **Patient Request Status Updates:**
   `PatientOverview.jsx` and `PatientRequests.jsx` subscribe to `blood_requests` changes filtering by `patient_id = auth.uid()`. Any change to status (e.g. from `'Open'` to `'Donor Found'` or `'Fulfilled'`) propagates instantly to the patient's dashboard without page reloads.
3. **Donor Live Match Feed:**
   `DonorRequests.jsx` subscribes to `donor_notifications` and `blood_requests`. Instantly matches new invitations or community requests.

---

## 10. Step-by-Step Local Setup Guide

Follow these steps to run JeevanSetu locally:

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Step 1: Clone and Install
```bash
git clone <repository-url>
cd Thalassemia
npm install
```

### Step 2: Configure Environment
Create a `.env.local` file in the root directory (referring to `.env.example`):
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

---
*Developed with dedication to saving Thalassemia lives.*
