# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Team rules (DDD, SOLID, layering, what the AI may decide on its own) live in `AGENTS.md`; read it before changing code.

## Repository structure

Monorepo with two independent apps, each with its own dependencies and no shared code:

- `backend/` — NestJS 11 + TypeORM 0.3 + PostgreSQL API
- `frontend/` — Angular 21 (standalone components) + SSR

Run all commands from inside the respective directory (`cd backend` / `cd frontend`), not the repo root. Package manager in the repo today is npm (`package-lock.json`).

## Commands

### Backend (`backend/`)

```bash
npm run start:dev            # dev server with watch mode
npm run build                # nest build
npm run lint                 # eslint --fix
npm run lint:check           # eslint without --fix (what CI runs; includes context-boundary rules)
npm run test                 # jest unit tests (src/**/*.spec.ts)
npm run test -- iniciar-sesion   # run a single test file (jest pattern match)
npm run test:e2e             # e2e tests (test/*.e2e-spec.ts) against DATABASE_URL
npm run migration:run        # apply pending migrations (the app also runs them on startup)
npm run migration:show
npm run migration:generate -- src/database/migrations/<Name>   # diff entities vs DB
npm run seed                 # creates the initial ADMIN from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run load:test:all        # health + root + login load test (scripts/load-test.mjs)
```

Env vars are documented in `backend/.env.example`. The e2e tests run against the database in `DATABASE_URL`: each test creates its own data (`@gympanel.test` emails, unique name suffixes) and deletes only what it created. CI uses a throwaway Postgres service instead.

### Frontend (`frontend/`)

```bash
ng serve                     # dev server at localhost:4200
ng build                     # production build to dist/frontend/browser
ng test                      # vitest unit tests
ng test -- --testNamePattern="some test"   # run a single test (vitest builder)
```

## Architecture

The codebase is mid-migration to DDD bounded contexts. Out of scope for the product and already removed: memberships/payments, multi-gym, class schedules, superadmin.

### Backend layout

- `src/contexts/<ctx>/{domain,application,infrastructure,presentation}` — target structure. Only `auth` is migrated so far and is the reference example. Each context exposes a public API in its `index.ts`; ESLint (`no-restricted-imports`, generated from the folders in `src/contexts`) forbids importing another context's layers and forbids `domain/` from importing other layers or NestJS/TypeORM/Express.
- `src/modules/{users,plan-entrenamiento}` — legacy modules still to be migrated. `users` exposes the `UsuariosQuery` port (`usuarios.query.ts`, token `USUARIOS_QUERY`) that Auth uses instead of the user repository.
- `src/shared/domain` — shared kernel: `DomainError` categories (`NoEncontradoError` 404, `ConflictoError` 409, `ReglaDeNegocioError` 400, `NoAutorizadoError` 401, `ProhibidoError` 403), `Entity`, `ValueObject`. `src/shared/infrastructure/domain-error.filter.ts` maps them to HTTP with the same body shape as Nest's exceptions.
- `src/app.setup.ts` — global HTTP config (CORS, ValidationPipe, DomainErrorFilter) shared by `main.ts` and the e2e tests.

### Guards and roles

`AuthGuardsModule` (JWT config + `JwtAuthGuard` + `RolesGuard`) is separate from `AuthModule` (login) so that `users` can use the guards and also provide `UsuariosQuery` to the login without a circular dependency. Import them from `contexts/auth` (index). `AuthModule` is only registered in `app.module.ts`.

Authorization is per-route: protected endpoints stack `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles(UserRole.ADMIN | UserRole.CLIENTE)`. `JwtAuthGuard` attaches `{ sub, email, role }` to `request.user`. Client-scoped endpoints (`/plan-entrenamiento/mio`) take the user id from `request.user.sub`.

**Controller route ordering matters** — Nest matches routes in declaration order, so static segments (e.g. `ejercicios`, `grupos-musculares`, `mio`, `usuario/:userId`) must be declared *before* a catch-all `@Get(':id')`. Follow the existing ordering in `plan-entrenamiento.controller.ts`.

### Database

`synchronize` is off: every schema change goes through a migration in `src/database/migrations`, and the app runs pending migrations on startup (`migrationsRun`). Connection options are shared by the app and the TypeORM CLI (`src/database/database-options.ts`, `data-source.ts`). Keep table/column names explicit when moving entities. `schema:log` reports 3 jsonb default changes on `plan_entrenamiento` that are a known TypeORM false positive.

### User lifecycle

`User.estado` (`creado` → `activo` → `inactivo`) gates login: only `activo` users can log in (rule in `contexts/auth/domain/politica-de-acceso.ts`). New registrations (`POST /users`) always land as `role: CLIENTE`, `estado: CREADO`; an admin activates them with `PATCH /users/:id/estado`. Emails are unique system-wide. There is no endpoint to create admins: use `npm run seed`.

### Training plans

`PlanEntrenamiento` does not use child rows per day. A week is modeled as fixed-length (7) `jsonb` array columns on the plan itself: `ejercicios` (`number[] | null` per day), `repeticiones` (`string[] | null` per day), `descripcionesDias` (`string | null` per day). `tipo` distinguishes `predeterminado` (template) vs `editado` (customized copy for one user). A user is linked to a plan via `User.planEntrenamientoId`; reassigning deletes the previous `editado` plan if nobody else uses it.

### Frontend: routing, auth state, HTTP

Routes (`app.routes.ts`) are gated by two guards: `authGuard` (`data: { role: 'ADMIN' | 'CLIENTE' }`) blocks unauthenticated/wrong-role access with a `window.alert` + redirect; `publicGuard` on public routes force-logs-out a logged-in user only when navigating home *from* `/menu-admin` or `/menu-cliente` (or with `?fromMenu=1`) — otherwise it redirects a logged-in user to their role's menu. Session (`accessToken` + `currentUser`) lives in `AuthStateService`, backed by `localStorage` (wrapped in try/catch since SSR has no `localStorage`).

`auth.interceptor.ts` attaches the bearer token to every request and centrally handles `401`/`403`: logout + redirect to `/login` on 401, redirect to the role menu on 403, except for login requests, which are left to the login component.

`ver-plan` still has hardcoded "predefined plans" filtered by a frequency that came from the removed memberships; that section no longer shows (pending decision for the Planes frontend owner).

`environment.apiBaseUrl` is swapped at build time via `angular.json` `fileReplacements` (`environment.ts` for dev, `environment.prod.ts` for the `production` config, which is also `ng build`'s default configuration).

## CI and deployment

- CI: `.github/workflows/ci.yml` runs backend lint/build/unit/e2e (with a Postgres service) and frontend build/tests on every PR and push to `main`.
- Backend → Railway, root directory `backend`, config in `backend/railway.json`, healthcheck at `/health`. Env vars: see `backend/.env.example`.
- Frontend → Vercel, root directory `frontend`, config in `frontend/vercel.json`, build output `dist/frontend/browser`.
- If the Railway backend URL changes, update `frontend/src/environments/environment.prod.ts` and redeploy the frontend — it is not read from an env var at runtime.
