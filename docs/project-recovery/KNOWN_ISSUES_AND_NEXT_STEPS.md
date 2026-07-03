# Known Issues and Next Steps

## Practical Development Checklist

### 1. Roadmap Feature (Uncommitted State)
* **Priority**: P0 (Blocker for next commit)
* **Description**: There are untracked files (`RoadmapCanvas.tsx`, `roadmaps.ts`) and modified components (`HomeView.tsx`, `AppHeader.tsx`, `LearningPathsModal.tsx`) that indicate a partially finished "Learning Paths" or Roadmap feature. 
* **Evidence**: `git status` shows these files modified but unstaged.
* **Likely files involved**: `src/components/Home/HomeView.tsx`, `src/components/Shared/LearningPathsModal.tsx`, `src/components/Shared/RoadmapCanvas.tsx`
* **Recommended first action**: Review the unstaged changes with `git diff`. If the roadmap logic is complete, stage and commit. Otherwise, finish the UI wiring so it doesn't block other work.

### 2. Follow-Up Synchronization Integrity
* **Priority**: P1 (Important)
* **Description**: Local storage caching is currently used alongside Supabase to track follow-up times (`novintech_cloud_followups_`). There might be edge cases if the browser cache is cleared.
* **Evidence**: In `useAppContext.tsx`, there are mechanisms bridging `localStorage` mapped by `contactId` to the cloud records.
* **Likely files involved**: `src/hooks/useAppContext.tsx`
* **Recommended first action**: Ensure that loading contacts from the cloud perfectly reinstates the local follow-up cache if it's missing.

### 3. Manager Presence Monitoring
* **Priority**: P2 (Nice to have)
* **Description**: The 60s heartbeat in `SessionManager` (`App.tsx`) could leave sessions "hanging" briefly if an agent closes the tab abruptly.
* **Evidence**: `heartbeat_session` RPC interval logic in `App.tsx`.
* **Likely files involved**: `src/App.tsx`, `supabase/migrations/20260626_reconcile_stale_expert_sessions.sql`
* **Recommended first action**: Verify that the stale session reconciliation migration handles abrupt disconnects efficiently without polluting the manager dashboard.

### 4. Products.csv Legacy Cleanup
* **Priority**: P2 (Nice to have)
* **Description**: A large `Products.csv` (1.6MB) and various Python script artifacts (`parse_csv.py`, `analyze_csv.js`) exist in the root. It is unclear if they are still needed.
* **Evidence**: Root directory listing.
* **Likely files involved**: `Products.csv`, `parse_csv.py`, `analyze_csv.cjs`
* **Recommended first action**: Move these scripts and data files into a `tools/` or `data-migration/` directory, or delete them if the data is already seeded in Supabase.
