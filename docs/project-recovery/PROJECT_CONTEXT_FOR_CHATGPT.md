# Project Context

**Project Name:** novintech-call-manager (NT-Call-Center)
**Purpose:** A comprehensive web-based call center management application for tracking expert calls, client contacts, and follow-ups.

**Business Context:** 
This application serves a sales or advisory team ("Experts/Agents") and their managers ("Admins") to handle leads and contacts. Agents make calls, schedule follow-ups, and log details like courses of interest, call status, and notes. The manager dashboard provides oversight and account approval.

**Current Development Status:**
Active development. Core features like authentication, routing, manager dashboard, and agent workflows (call attempts, cloud sync, follow-ups) are implemented. Local and cloud data synchronization has been partially established.

**Technology Stack:**
* **Frontend:** React 18, Vite, TypeScript, TailwindCSS v4
* **UI/UX:** Radix UI, Lucide React, Framer Motion (motion/react), Chart.js
* **Backend/Database:** Supabase (PostgreSQL), with extensive use of RPCs and Row Level Security (RLS) for secure data mutation.
* **Authentication:** Supabase Auth with custom profiles integration.

**Main Folders and Responsibilities:**
* `src/components/`: Modular React components divided by domain (Auth, Manager, Calls, Home, Profile, Reports, Shared, UI).
* `src/hooks/`: Custom hooks like `useAuth.tsx` for session management and `useAppContext.tsx` for global app state.
* `src/data/` & `src/constants/`: Static configuration, courses, roadmap logic.
* `supabase/migrations/`: Complete history of database schema changes and RPCs.

**Main Screens/Pages:**
* **Auth Screen:** Login and Registration.
* **Manager Dashboard:** Admin view for approving users, monitoring presence, and viewing global stats.
* **Call List Workspace (Dashboard):** Main agent view with tabs for Queue, Today, Follow-ups, and Stats.
* **Profile / Settings / Blacklist / About:** General configuration and utilities.

**User Roles and Access Levels:**
1. **Admin (Manager):** Can approve/disable agents, monitor agent presence, and view reports. Cannot act as an agent directly.
2. **Agent (Expert):** The primary operator. Can add contacts, log call attempts, set follow-ups, and manage their own queue. Must be approved by an Admin to gain access.
3. **Pending/Disabled:** Authenticated users awaiting manager approval or those whose access was revoked.

**Core Workflows:**
* **Signup & Approval:** Agent signs up -> Status is "pending" -> Admin approves -> Agent accesses workspace.
* **Call Logging:** Agent adds a contact (or bulk imports) -> Logs call attempts (which generates an immutable history log) -> Schedules follow-up.
* **Session & Presence:** System tracks agent session heartbeats (every 60s) and activity to determine online/idle status.
* **Follow-ups:** Contacts marked for follow-up are pushed to the "Follow-ups" queue.
* **Security:** Database mutations strictly use PostgreSQL RPC functions (`create_contact`, `create_call_attempt`) with `SECURITY DEFINER` and tight RLS.

**Database/Data Model Summary:**
* `public.profiles`: Extends `auth.users` with roles, duty groups, and approval states.
* `public.expert_contacts`: Represents individual leads/clients assigned to an expert.
* `public.call_attempts`: Immutable history of every call interaction for a contact.
* `public.expert_sessions`: Tracks active sessions and online presence.
* `public.expert_activities`: Granular activity logs.

**External Services and Integrations:**
* **Supabase:** Primary backend for Auth, Database, and Edge Functions (if any).

**Important Commands to Run the Project:**
* `npm install` (Install dependencies)
* `npm run dev` (Run locally on port 3000)
* `npm run build` (Production build)

**Current Known Issues:**
* Uncommitted changes exist for `src/components/Home/HomeView.tsx`, `src/components/Layout/AppHeader.tsx`, `src/components/Shared/LearningPathsModal.tsx`, `src/hooks/useAppContext.tsx`.
* Untracked files exist for roadmap feature (`src/components/Shared/RoadmapCanvas.tsx`, `src/data/roadmaps.ts`).

**Immediate Next Development Priorities:**
* Stabilize and commit the currently untracked Roadmap features.
* Resolve any discrepancies in local vs cloud follow-up sync (partially handled in `useAppContext.tsx`).
* Finish UI polish for the Manager Dashboard.

**Important Architectural Decisions Reflected in Code:**
* **Security First:** UI clients never mutate data directly. All changes (insert/update/delete) route through PostgreSQL RPCs.
* **Role Mismatch Prevention:** `App.tsx` has dedicated catch screens if an Admin tries to load the Agent panel or vice-versa.
* **Local Storage Cache:** The app caches follow-up states and UI preferences locally to maintain speed, syncing with Supabase in the background.

**Do Not Break These Things:**
* **Supabase RPC Interfaces:** Frontend relies heavily on specific RPC signatures (`create_contact`, `create_call_attempt`, etc.).
* **useAuth vs useAppContext Separation:** Authentication is strictly decoupled from the business logic layer to prevent cyclic dependencies.
* **Role/Status Checks:** The check for `active_admin` and `active_agent` drives all routing.
* **Migration History:** Never alter existing executed SQL migrations.

**Questions that still need answers:**
* What is the exact deployment environment configuration (Vercel specifics)?
* Are there scheduled jobs for daily message delivery referenced in `20260630_add_followup_reviews_and_daily_messages.sql`?
* How is the legacy `Products.csv` currently being utilized if at all?
