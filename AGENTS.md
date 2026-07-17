# AGENTS.md

AFAD Gönüllü Eğitim Yönetim Sistemi — Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL.

## Cursor Cloud specific instructions

### Services / how to run
- Single app: Next.js dev server on port 3000. Standard scripts live in `package.json` (`pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`, `pnpm test`).
- PostgreSQL is required and is NOT bundled in the app process. On this VM it is installed via apt and must be running before DB commands or the dev server. Start it with: `sudo pg_ctlcluster 16 main start` (idempotent-ish; ignore "already running").
- Local DB credentials expected by `.env`: role `afad` / password `afad` / database `afad_egitim` on `127.0.0.1:5432`. If the cluster is fresh, create them once:
  `sudo -u postgres psql -c "CREATE USER afad WITH PASSWORD 'afad' CREATEDB;"` and
  `sudo -u postgres psql -c "CREATE DATABASE afad_egitim OWNER afad;"`.
- `.env` is committed intentionally for local/dev convenience (synthetic data, dev-only secret). `AUTH_SECRET` must be ≥16 chars or auth throws.

### Database / seed
- After dependencies + running Postgres: `pnpm prisma migrate deploy` then `pnpm db:seed` (alias of `pnpm db:import`, reads `data/veri_seti.csv`).
- The seed/import is idempotent (code-based upserts) — safe to re-run; it will NOT duplicate rows.
- If you change `prisma/schema.prisma`, run `pnpm prisma migrate dev --name <name>` and `pnpm prisma generate`.

### Non-obvious gotchas
- pnpm build scripts are gated: `package.json` `pnpm.onlyBuiltDependencies` allows `@prisma/client`, `prisma`, `esbuild`. Do NOT run the interactive `pnpm approve-builds`.
- Prisma Client must be generated before typecheck/build/dev after a fresh install (`pnpm prisma generate`; also runs in `build`).
- Auth is a custom JWT httpOnly cookie (`afad_session`) via `jose`; middleware (`src/middleware.ts`) guards `/volunteer`, `/instructor`, `/coordinator` and redirects by role. Passwords hashed with `bcryptjs`.
- Realtime UI updates use `router.refresh()` (server components) plus TanStack Query invalidation (analytics/map). There is no websocket server to run.
- Integration tests (`tests/integration.test.ts`) run read-only against the seeded DB and are skipped automatically when `DATABASE_URL` is unset.
- Demo login accounts are documented in `README.md` (Demo Hesaplar). Data is fully synthetic.
