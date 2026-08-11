# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository structure

Monorepo with two independent apps, each with its own dependencies and no shared code:

- `backend/` — NestJS 11 + TypeORM 0.3 + PostgreSQL API
- `frontend/` — Angular 21 (standalone components) + SSR

Run all commands from inside the respective directory (`cd backend` / `cd frontend`), not the repo root.

## Commands

### Backend (`backend/`)

```bash
npm run start:dev          # dev server with watch mode
npm run build               # nest build
npm run lint                 # eslint --fix
npm run test                 # jest unit tests
npm run test -- users.service.spec   # run a single test file (jest pattern match)
npm run test:watch
npm run test:cov
npm run test:e2e             # jest -c ./test/jest-e2e.json
npm run load:test:all        # health + root + login load test (scripts/load-test.mjs)
```

Load-test env vars (`API_URL`, `LOAD_CONCURRENCY`, `LOAD_DURATION_SEC`, `LOAD_LOGIN_EMAIL`, `LOAD_LOGIN_PASSWORD`) are read from `backend/.env` if present; shell env vars take priority.

### Frontend (`frontend/`)

```bash
ng serve                     # dev server at localhost:4200
ng build                     # production build to dist/frontend/browser
ng test                      # vitest unit tests
ng test -- --testNamePattern="some test"   # run a single test (vitest builder)
```

## Architecture

### Backend: modules, guards, roles

Four feature modules under `backend/src/modules/`: `auth`, `users`, `membresia`, `plan-entrenamiento`. `AuthModule` exports `JwtModule`, `JwtAuthGuard`, `RolesGuard` for reuse by the other modules.

Authorization is per-route, not global: every protected endpoint stacks `@UseGuards(JwtAuthGuard, RolesGuard)` with `@Roles(UserRole.ADMIN | UserRole.CLIENTE)`. `JwtAuthGuard` verifies the bearer token and attaches the payload (`{ sub, email, role }`) to `request.user`; `RolesGuard` reads `@Roles` metadata via `Reflector` and checks `request.user.role`. Client-scoped endpoints (`/membresia/mi-*`, `/plan-entrenamiento/mio`) pull the user id from `request.user.sub` rather than a route param.

**Controller route ordering matters** — Nest matches routes in declaration order, so static segments (e.g. `tipos`, `pagos/:id`) must be declared *before* a catch-all `@Get(':id')` on the same controller, or they become unreachable. Follow the existing ordering in `plan-entrenamiento.controller.ts` when adding routes; `membresia.controller.ts` has existing ordering issues worth checking before assuming a route is reachable.

DB schema is derived from TypeORM entities: `synchronize: !isProduction` in `app.module.ts`, so schema changes in dev happen by editing entity files and restarting — no migrations exist in this codebase. `autoLoadEntities: true` means new entities just need to be registered in their module's `TypeOrmModule.forFeature([...])`.

### User lifecycle

`User.estado` (`creado` → `activo` → `inactivo`, `user-status.enum.ts`) gates login: `AuthService.login` throws `ForbiddenException` if `estado !== ACTIVO`. New registrations (`UsersService.create`) always land as `role: CLIENTE`, `estado: CREADO` — an admin must explicitly activate the account (`PATCH /users/:id/estado`) before the user can log in. `GET /users/pendientes` and `/users/clientes-activos` exist specifically to drive that admin approval workflow.

### Membership/payment model

`Membresia` belongs to a `TipoMembresia`. The join table `UserMembresia` (unique on `userId`+`membresiaId`) links a user to a membership and carries an `EstadoUserMembresia` (notably `PENDIENTE_PAGO` / `AL_DIA` — matched by name string in `UsersService`). `Pago` rows hang off a `UserMembresia`. `TipoMembresia.id === 1` is treated as the "training" membership type (one active row per user, reassigned in place) and `id === 2` as "complementary" (additive, multiple allowed) — this distinction is hardcoded by numeric id in `UsersService.updateMembershipByAdmin`, not looked up by name.

### Training plans

`PlanEntrenamiento` does not use child rows per day. A week is modeled as fixed-length (7) `jsonb` array columns on the plan itself: `ejercicios` (`number[] | null` per day), `repeticiones` (`string[] | null` per day), `descripcionesDias` (`string | null` per day). `tipo` distinguishes `predeterminado` (template) vs `editado` (customized for a user). A user is linked to a plan via `User.planEntrenamientoId`; `PlanEntrenamientoController.findMine`/`findByUserId` resolve both the assignment and the plan body.

### Frontend: routing, auth state, HTTP

Routes (`app.routes.ts`) are gated by two guards instead of a shared layout: `authGuard` (`data: { role: 'ADMIN' | 'CLIENTE' }`) blocks unauthenticated/wrong-role access with a `window.alert` + redirect; `publicGuard` on public routes force-logs-out a logged-in user only when navigating home *from* `/menu-admin` or `/menu-cliente` (or with `?fromMenu=1`) — otherwise it redirects a logged-in user away from public pages to their role's menu. Session (`accessToken` + `currentUser`) lives in `AuthStateService`, backed by `localStorage` (wrapped in try/catch since SSR has no `localStorage`).

`auth.interceptor.ts` attaches the bearer token to every request and centrally handles `401`/`403`: it logs out + redirects to `/login` on 401 and redirects to the user's role menu on 403, except for login requests and the public membership-catalog GET (`/membresia` or `/membresia/tipos`), which are left for the calling component to handle.

`environment.apiBaseUrl` is swapped at build time via `angular.json` `fileReplacements` (`environment.ts` for dev, `environment.prod.ts` for the `production` config, which is also `ng build`'s default configuration).

## Deployment

- Backend → Railway, root directory `backend`, config in `backend/railway.json`, healthcheck at `/health`. Env vars: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (see `backend/.env.example`).
- Frontend → Vercel, root directory `frontend`, config in `frontend/vercel.json`, build output `dist/frontend/browser`.
- If the Railway backend URL changes, update `frontend/src/environments/environment.prod.ts` and redeploy the frontend — it is not read from an env var at runtime.
