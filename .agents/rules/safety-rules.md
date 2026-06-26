---
trigger: always_on
---

You are working on an active production-connected React/Vite application named `novintech-call-manager` / `NT-Call-Center`.

The application is connected to Vercel and Supabase. Local testing and the deployed application may use real authentication and database services.

## Default operating mode

* Work locally on the current branch only.
* Do not create, switch, delete, merge, or rename branches unless I explicitly request it.
* Do not commit, push, merge, rebase, reset, stash, force-push, or run destructive Git commands unless I explicitly request that action in the current conversation.
* Never push to `main` unless I explicitly confirm that the change is final and ready for production release.
* Never use `git push --force`, `git reset --hard`, `git clean -fd`, destructive rebases, or delete files/data unless I explicitly ask.

## Scope discipline

* Change only what I requested.
* Do not perform unrelated refactors, file reorganizations, dependency upgrades, styling changes, or architecture rewrites.
* Preserve existing working behavior unless I explicitly ask to change it.
* If the requested change may affect login, roles, data, security, deployment, or another existing feature, inspect the relevant architecture first and explain the impact before editing.

## Protected systems

Do not modify any of the following unless I explicitly request it:

* Supabase database schema
* Existing executed migrations
* Supabase RLS policies
* RPC functions
* Auth flow, session handling, role logic, approval logic, or redirect logic
* Supabase URL configuration
* Vercel settings or environment variables
* `.env`, `.env.local`, secrets, API keys, publishable keys, or service-role keys
* `package.json`, lock files, Vite configuration, build configuration, or dependencies

Rules for protected systems:

* Never edit or delete an already executed migration. Create a new migration file for every new database change.
* Never execute SQL in Supabase without my explicit approval.
* Never place a Supabase secret key or `service_role` key in frontend code.
* Never commit `.env`, `.env.local`, secrets, `node_modules`, `dist`, cache files, or generated build files.

## Required process after every implementation

After making a requested local change:

1. Run `npm run build`.
2. Run `git diff --check`.
3. Report in Persian:

   * changed files
   * build result
   * any possible impact on Auth, Supabase, database, Vercel, or deployment
   * anything unexpected
4. Do not commit or push.
5. Wait for my explicit approval.

## High-risk change process

For any request involving database, Supabase, authentication, roles, RLS, migrations, permissions, Vercel, environment variables, or security:

1. Inspect the current implementation first.
2. Explain the proposed plan and risks in Persian.
3. Do not make changes until I explicitly approve the plan.
4. Do not execute Supabase SQL or publish changes unless explicitly instructed.

## Release process

When I explicitly say a change is final and ready for production:

1. Run `npm run build`.
2. Run `git diff --check`.
3. Show a concise final changed-files list.
4. Confirm that no `.env`, `.env.local`, secrets, `node_modules`, `dist`, or cache files are staged.
5. Wait for my explicit confirmation before commit and push.
6. Only then commit and push to `origin/main`.
7. Never force-push.
