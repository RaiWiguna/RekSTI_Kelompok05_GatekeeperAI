# Gatekeeper AI

Monorepo Gatekeeper AI untuk sistem presensi dan kontrol akses ruang kelas berbasis face recognition.

Dokumen utama:

- `docs/system-prd.md`
- `docs/high-architecture.md`
- `docs/local-dev-setup.md`

## Quick Start

1. Aktifkan `pnpm`:

```powershell
corepack enable
corepack prepare pnpm@10.0.0 --activate
```

2. Install dependency:

```powershell
pnpm install
```

3. Salin env file:

```powershell
Copy-Item .env.example .env
```

4. Jalankan infrastruktur lokal:

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```

Catatan:

- PostgreSQL host default memakai port `55432`
- Redis host default memakai port `56379`
- ini sengaja dibuat non-standar untuk menghindari bentrok dengan service lokal lain

5. Verifikasi build monorepo:

```powershell
pnpm build
```

6. Jalankan service dasar:

```powershell
pnpm --filter @gatekeeper/api dev
pnpm --filter @gatekeeper/web dev
pnpm --filter @gatekeeper/iot-gateway dev
```

Panduan lengkap ada di `docs/local-dev-setup.md`.

## Struktur Inti

- `apps/api`
- `apps/web`
- `apps/mobile`
- `services/iot-gateway`
- `services/attendance-engine`
- `services/face-recognition`
- `packages/shared-*`
- `infra/docker`

## Catatan Baseline

- `apps/web`, `apps/api`, dan `services/iot-gateway` adalah baseline runtime utama untuk Sprint 0.
- `apps/mobile` masih placeholder tetapi sudah bisa dijalankan dengan `expo start`.
- `services/face-recognition` memakai Python dan belum masuk workflow `pnpm build`.
- `apps/device-console` masih placeholder dokumentasi dan belum punya `package.json`.
