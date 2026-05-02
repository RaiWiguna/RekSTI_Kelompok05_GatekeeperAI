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
