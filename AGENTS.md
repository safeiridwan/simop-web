# AGENTS.md — simop-web

Vue 3 SPA frontend for SIMOP. See the parent
[`../../AGENTS.md`](../../AGENTS.md), [`../../planning/SIMOP_Coding_Plan.md`](../../planning/SIMOP_Coding_Plan.md),
and [`../../docs/development-patterns.md`](../../docs/development-patterns.md)
first; this file covers only app-specific conventions.

## Stack

- Vue 3 + TypeScript + Vite.
- Pinia (state), Vue Router.
- Tailwind CSS.
- Vitest (unit tests, happy-dom).

## Layout

```
src/
  app/
    router/        # route table
    stores/        # Pinia stores
    layouts/       # shared shells
  modules/
    <feature>/
      pages/
      components/
      api.ts       # calls the Go API
      types.ts
      routes.ts
  components/      # shared components
  composables/
  services/        # HTTP client, shared clients
  types/
  utils/
```

## Rules

- Data flow: `Page → composable/store → api.ts → services/http → Go API` (plan §46).
- Keep business logic out of components.
- Every list view ships loading, empty, and error states (plan §53).
- Mask sensitive data (e.g. NIK) by default (plan §24, §51).
- Do not add a UI library without an ADR.

## Auth (Phase 1)

- Access token lives in memory (`services/http`); the refresh token is an
  httpOnly cookie handled by the browser.
- `services/http` attaches the bearer token, retries once after a 401 by calling
  `/api/v1/auth/refresh`, and throws `HttpError` on failure.
- `stores/auth` (Pinia) holds the user, `can(code)` permission checks, and
  `bootstrap()` which resolves the session from the refresh cookie on load.
- Route guards use `meta.requiresAuth` and `meta.permission`.

## Commands

```bash
make check      # install + type-check + test + build
make dev        # dev server on :5173
```
