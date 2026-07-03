# Project File Map

## Root Configuration
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `package.json` | Dependencies and scripts | `"dev": "vite..."`, deps: react, radix-ui, supabase-js | Active |
| `vite.config.ts` | Vite bundler config | Plugins: react, tailwindcss | Active |
| `tsconfig.json` | TypeScript compiler options | Base config | Active |
| `tailwind.config.js` | Tailwind definitions (if any) | (Replaced/supplemented by vite tailwind plugin) | Active |
| `.env.example` | Template for environment variables | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Active |
| `README.md` | Basic run instructions | `npm run dev` | Active |

## Frontend Entry & Hooks
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `src/main.tsx` | React DOM rendering | Mounts `<App />` | Active |
| `src/App.tsx` | Main routing and auth boundary | `App`, `FollowupReminder`, `SessionManager` | Active |
| `src/types.ts` | Shared TypeScript interfaces | `Profile`, `CallRecord`, `CallAttempt`, `SupabaseProfile` | Active |
| `src/hooks/useAuth.tsx` | Supabase auth integration | `AuthProvider`, `useAuth`, `signIn`, `signUp`, `signOut` | Active |
| `src/hooks/useAppContext.tsx` | Global state for data | `AppProvider`, `useAppContext`, calls/blacklist logic | Active |

## Backend / Database Integration
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `src/lib/supabase.ts` | Supabase client singleton | `supabase` (createClient instance) | Active |
| `supabase/migrations/20260625_create_profiles.sql` | Users & roles schema | `profiles` table, `is_admin()`, `approve_agent()` | Active |
| `supabase/migrations/20260626_add_cloud_contacts_and_call_attempts.sql` | Main business schema | `expert_contacts`, `call_attempts`, RPC mutators | Active |

## Core Components
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `src/components/Manager/ManagerDashboard.tsx` | Admin control panel | Approvals, global stats, online presence | Active |
| `src/components/Calls/CallListWorkspace.tsx` | Agent dashboard | Main working area for agents | Active |
| `src/components/Home/HomeView.tsx` | Initial landing / hub | Links to workspace | Active |
| `src/components/Auth/AuthScreen.tsx` | Login and Registration | User entry point | Active |
| `src/components/Layout/AppHeader.tsx` | Navigation & Profile bar | Branding, user menu | Active |
| `src/components/Shared/RoadmapCanvas.tsx` | Educational paths view | Untracked component | Active |

## Styles and Assets
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `src/index.css` | Global CSS | Tailwind directives, custom classes | Active |
| `src/NT Logo.svg` | Brand logo | Main logo asset | Active |

## Scripts / Utilities
| Path | Responsibility | Important Exports/Notes | Condition |
| :--- | :--- | :--- | :--- |
| `Products.csv` | Legacy data or seed material | Large dataset | Unclear / Likely unused actively |
| `extract_meta.py` | Python script for something | Unknown utility | Unclear |
| `parse_csv.py` | Python parser | Unknown utility | Unclear |
