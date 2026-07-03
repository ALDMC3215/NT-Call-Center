# Project Recovery & Full Technical Handover

## 1. Executive Summary

This project (`novintech-call-manager` / `NT-Call-Center`) is a robust, web-based CRM and call management system tailored for an advisory or sales team. It manages contacts, logs call attempts securely, tracks follow-up dates, and offers a manager dashboard for oversight and user approval. The current state is highly functional with secure Supabase authentication, PostgreSQL RLS, and a React/Vite frontend. The core call center workflow is complete, but there is active, uncommitted work on a "Roadmap/Learning Paths" educational feature.

## 2. Repository Overview

* **Root Directory:** Contains project configuration files (`package.json`, `vite.config.ts`, `tsconfig.json`) and some legacy data scripts/files (e.g., `Products.csv`, `parse_csv.py`).
* **`src/`:** Contains all React frontend source code, split into logical domains.
* **`supabase/migrations/`:** Contains the entire database schema history, RPC definitions, and Row Level Security policies.
* **Important Configuration Files:** `.env.local` (expected to hold `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`), `vite.config.ts`.
* **Framework:** React 18 with Vite.

## 3. Technology Stack

* **Vite (v6.2.3):** Core build tool and development server. Replaces Create React App for speed.
* **React (v18.3.1):** UI Framework. Core.
* **TailwindCSS (v4.1.14):** Utility-first CSS framework for styling. Core.
* **Supabase Client (`@supabase/supabase-js` v2):** Handles authentication and secure database RPC calls. Core.
* **Radix UI:** Headless accessible UI components used for dialogs, labels, and checkboxes. Optional but heavily integrated.
* **Framer Motion (`motion/react` v12):** Used for advanced UI animations, layout transitions, and page loading states. Core visual element.
* **Chart.js / Recharts:** Data visualization in the manager and stats views. Optional but integrated.
* **Lucide React:** Iconography library. Core.

## 4. Product Purpose and Business Logic

The product allows "Experts" (sales agents or advisors) to log in, manage a list of phone numbers (contacts), call them, and record the outcome of the call.
1. **Approval:** A new agent registers but is placed in a "pending" state. A Manager logs in and "approves" them.
2. **Contact Creation:** Agents add contacts manually or via bulk import.
3. **Call Attempts:** Every time a contact is called, a `call_attempt` row is immutably written to the database. The main contact record is then updated with the latest status.
4. **Follow-ups:** If a call requires a follow-up, it schedules a time. The system alerts agents when follow-ups are due.
5. **Presence:** While an agent is logged in, the app pings the server every 60s so managers can view real-time online status and activity.

## 5. User Roles, Authentication, and Permissions

* **Flow:** Handled by Supabase Auth (email/password). A custom PostgreSQL trigger auto-creates a row in `public.profiles`.
* **Roles:** 
  * `agent`: Operational role. Only sees their own contacts. Must have `account_status = 'active'` to access the dashboard.
  * `admin`: Management role. Can view all profiles, approve/disable agents, and view global metrics.
* **Permissions/RLS:** Supabase RLS enforces that agents can only read their own contacts and call attempts. All writes (inserts/updates/deletes) are forced through `SECURITY DEFINER` Postgres functions (RPCs) which validate permissions serverside, making it impossible for the frontend to bypass business rules.
* **Routing:** `App.tsx` prevents Admins from loading the Agent panel and vice-versa, displaying mismatch banners.

## 6. Pages, Routes, and Screens

*Because the app uses conditional rendering via state (`useAppContext.tsx -> currentView`) rather than strict URL routing (like react-router-dom), all "routes" are rendered on a single page.*

| View State | Page Name | Purpose | Main Components | Required Role | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| N/A | Auth Screen | Login/Register | `AuthScreen`, `PendingScreen` | None | Complete |
| N/A | Manager Dash | Admin oversight | `ManagerDashboard` | `admin` | Complete |
| `home` | Home View | Landing / Hub | `HomeView` | `agent` | Active Dev |
| `dashboard` | Call Workspace | Main agent UI | `CallListWorkspace` | `agent` | Complete |
| `profile` | Profile | Agent details | `ProfileView` | `agent` | Complete |
| `settings` | Settings | Customization | `SettingsView` | `agent` | Complete |
| `blacklist` | Blacklist | Blocked numbers | `BlacklistView` | `agent` | Complete |

## 7. UI/UX and Design System

* **Styling Approach:** Tailwind CSS driven. High emphasis on modern, fluid UI (gradients, shadow-sm, rounded-xl).
* **Colors:** Configurable "Accent Color" (brand color) via Settings, injecting CSS variables like `--theme-brand-500` dynamically into `App.tsx`.
* **Interactivity:** Framer Motion drives page transitions (`AnimatePresence`). `ClickSpark` component provides custom click effects.
* **Localization:** Fully RTL (Right-to-Left) optimized for Persian text, using fonts like 'Iranyekan' and 'Yekanbakh' (present in root but likely loaded globally).

## 8. Frontend Architecture

* **State Management:** React Context (`AppContext`, `AuthContext`). No Redux.
* **API Strategy:** UI components call hooks (`useAppContext`, `useAuth`). Hooks execute `supabase.rpc()` calls to mutate data, and `supabase.from()` to read data.
* **Component Organization:** Split into subfolders in `src/components/` by feature. Heavy use of `React.lazy()` and `Suspense` in `App.tsx` for code splitting.

## 9. Backend Architecture

* **Serverless Backend:** No traditional Node/Express backend. Uses Supabase as a Backend-as-a-Service.
* **Controllers/Validation:** Handled entirely within PostgreSQL RPCs using PL/pgSQL. Functions like `create_contact` and `normalize_phone` strictly validate input (e.g., Iranian 11-digit mobile requirement).
* **Data Privacy:** Hardened RLS policies prevent direct table mutation.

## 10. Database and Data Model

* **`profiles`**: Extends auth users. Fields: `id`, `email`, `full_name`, `role`, `account_status`, `duty_group`, `approved_by`.
* **`expert_contacts`**: A single lead assigned to an expert. Fields: `id`, `expert_id`, `phone`, `phone_normalized`, `full_name`, `call_status`, `notes`.
* **`call_attempts`**: Immutable log. Fields: `id`, `contact_id`, `expert_id`, `call_status`, `notes`, `created_at`.
* **`expert_sessions` & `expert_activities`** (Implied by presence RPCs): Tracks online time and interactions.

## 11. APIs and Integrations

All API calls are directed to Supabase.
* **`auth.signInWithPassword` / `signUp`**: Standard authentication.
* **RPC `approve_agent(target_id)`**: Admin only.
* **RPC `disable_agent(target_id)`**: Admin only.
* **RPC `create_contact(...)`**: Agent creates a new lead. Returns UUID.
* **RPC `update_contact(...)`**: Agent updates a lead.
* **RPC `create_call_attempt(...)`**: Agent logs a call. Modifies contact and creates history row atomically.
* **RPC `record_activity(session_id)`**: Presence heartbeat.

## 12. Configuration and Environment Variables

* `VITE_SUPABASE_URL`: Supabase project endpoint. Required.
* `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anon key. Required.

## 13. Development Workflow

* **Install:** `npm install`
* **Run:** `npm run dev`
* **Build:** `npm run build`
* **Lint:** `npm run lint` (`tsc --noEmit`)
* **Local Setup Sequence:** Create `.env.local` with Supabase keys -> run `npm install` -> execute all files in `supabase/migrations/` chronologically in the Supabase SQL editor -> run `npm run dev`.

## 14. Deployment and Production Readiness

* **Hosting:** Configured for Vercel deployment based on Git commit history (`0ef81be`).
* **Production Risks:** The database relies heavily on the migrations being executed perfectly in order. If a new schema change is needed, a new migration file MUST be created; never edit existing migrations.
* **CI/CD:** Connected to Vercel via GitHub (inferred from branch status `up to date with origin/main`).

## 15. Git and Development Timeline

*Current Branch:* `main`
* **Phase 1:** Initial setup and Vercel hookup.
* **Phase 2:** Strict Role-based access control and Supabase RPC integration.
* **Phase 3:** Manager presence tracking implementation.
* **Phase 4:** Transition from local storage caching to robust Cloud contact/attempt logging.
* **Phase 5 (Current Uncommitted):** Addition of the "Learning Paths / Roadmap" educational features.
*All facts verified via Git history.*

## 16. Current State of Every Major Feature

| Feature | Status | Evidence | Relevant Paths | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| Auth & Approval | Complete | `useAuth.tsx` & Migrations | `hooks/useAuth.tsx`, `components/Auth/` | None |
| Call Logging | Complete | RPCs and `CallListWorkspace` | `hooks/useAppContext.tsx`, `migrations/` | None |
| Follow-up Sync | Partially Complete | Local vs Cloud cache logic | `hooks/useAppContext.tsx` | Ensure flawless sync |
| Roadmap/Paths | Partially Complete | Unstaged files | `src/data/roadmaps.ts`, `HomeView.tsx` | Complete and commit |

## 17. Known Issues, Risks, Technical Debt, and Incomplete Work

* **Uncommitted UI work:** The `HomeView.tsx` and Roadmap features are mid-development.
* **Local Storage Dependency:** The app still uses `localStorage` for `novintech_cloud_followups_` to manage some follow-up dates locally. This should ideally be entirely derived from the `expert_contacts` database state to prevent desyncs on new devices.
* **Legacy Scripts:** Root folder is cluttered with `.py` and `.csv` files that represent early prototyping or data-seeding and should be cleaned up.

## 18. Recommended Next Steps

* **P0: Stage and commit the Roadmap feature.** (Files: `HomeView.tsx`, `RoadmapCanvas.tsx`).
* **P1: Code Review `useAppContext.tsx`.** It is 500+ lines long and handles everything from theming to database RPCs. Extracting theming and caching to separate hooks would improve maintainability.
* **P2: Root directory cleanup.** Move all Python scripts to a `scripts/` folder.

## 19. Handoff Notes for the Next AI Assistant

* **What to inspect first:** Check the uncommitted changes in `git status` to see exactly what the previous developer was working on right before this handover.
* **Safe assumptions:** You can assume the Supabase backend is rock-solid and secured by RLS. The RPCs (`create_contact`, etc.) work flawlessly.
* **Unsafe assumptions:** Do not assume `localStorage` is purely for preferences; it actually holds critical follow-up state (`novintech_cloud_followups_`) right now.
* **Central files:** `src/App.tsx` (routing), `src/hooks/useAppContext.tsx` (business logic), `src/hooks/useAuth.tsx` (session/roles).
* **Do NOT change casually:** Never alter executed SQL migrations in `supabase/migrations/`. Always create a new file (e.g., `20260703_feature.sql`). Do not break the `active_agent` / `active_admin` routing catch in `App.tsx`.

## 20. Evidence Appendix

* **Git History:** The timeline strictly matches `git log --oneline`.
* **Database Logic:** Verified via reading `20260625_create_profiles.sql` and `20260626_add_cloud_contacts_and_call_attempts.sql`.
* **Current State:** Captured via `git status` output on `2026-07-03`.
