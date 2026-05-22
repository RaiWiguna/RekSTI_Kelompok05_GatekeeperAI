# Scripts

Repository automation scripts live here.
## Dev Launchers

Shortcut scripts now available from repo root:

```powershell
pnpm dev:web:stack
pnpm dev:mobile:stack
```

What they do:

- start Docker infrastructure
- run `pnpm db:generate`
- run `pnpm db:migrate:deploy`
- start the API dev server
- wait for `http://localhost:3001/v1/health`
- start the requested frontend target

The API dev launcher also checks whether `API_PORT` is already occupied. If the process on that port looks like an older Gatekeeper API instance from this workspace, it is stopped automatically before the new watcher starts.

## Docker troubleshooting

`dev:*:stack` expects Docker Desktop (Linux engine) to be running for local PostgreSQL/Redis.

If you see an error like `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`:

1. Start Docker Desktop.
2. Wait until engine status is `Running`.
3. Retry `pnpm dev:mobile:stack` (or `pnpm dev:web:stack`).

If your PostgreSQL/Redis already run outside Docker, skip Docker bootstrap:

```powershell
$env:SKIP_DOCKER='1'
pnpm dev:mobile:stack
```

If Windows blocks the default `POSTGRES_PORT=55432` with access-permission / excluded-port errors:

```powershell
$env:POSTGRES_PORT='56432'
$env:DATABASE_URL='postgresql://postgres:postgres@localhost:56432/gatekeeper?schema=public'
pnpm dev:web:stack
```

Tip: keep `POSTGRES_PORT` and `DATABASE_URL` port in sync.
