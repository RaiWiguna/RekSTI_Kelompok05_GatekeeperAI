# Database

Database assets for Gatekeeper AI live here.

Current baseline for Sprint 1 tahap 1:

- `schema.prisma`
  Core data schema for auth and master data.
- `migrations/`
  Initial SQL migration for a fresh local database.

Planned additions after this stage:

- seed script for demo admin and master data
- Prisma client wiring in `apps/api`
- repository/service layer for auth and CRUD modules

Common commands from repo root:

```powershell
pnpm db:format
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev -- --name sprint1_core_data_init
pnpm db:migrate:deploy
```

Catatan local Docker:

- default host port PostgreSQL untuk repo ini adalah `55432`
- jika Anda memakai `.env.example`, `DATABASE_URL` sudah diarahkan ke port itu
- ini membantu menghindari kasus Prisma tersambung ke instance PostgreSQL lokal lain di `5432`
