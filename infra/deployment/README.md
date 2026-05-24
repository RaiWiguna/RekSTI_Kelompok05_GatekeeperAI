# Deployment (VPS + Docker)

Panduan ini untuk skenario:
- Frontend `apps/web` deploy di Vercel
- Backend + infra (API, PostgreSQL, Redis, Nginx) deploy di VPS menggunakan Docker Compose

## 1) Siapkan Environment File

1. Copy template:

```powershell
Copy-Item infra/deployment/.env.vps.example infra/deployment/.env.vps
```

2. Edit value sensitif:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `DATABASE_URL` (harus konsisten dengan `POSTGRES_*`)

## 2) Build dan Jalankan Stack

```powershell
docker compose -f infra/docker/docker-compose.vps.yml --env-file infra/deployment/.env.vps up -d --build
```

Service yang dijalankan:
- `postgres`
- `redis`
- `migrate` (one-shot untuk `prisma migrate deploy`)
- `api`
- `nginx`

## 3) Verifikasi

```powershell
docker compose -f infra/docker/docker-compose.vps.yml --env-file infra/deployment/.env.vps ps
```

```powershell
docker compose -f infra/docker/docker-compose.vps.yml --env-file infra/deployment/.env.vps logs api --tail 100
```

Health check dari server:

```powershell
curl http://127.0.0.1/health
```

Respon yang diharapkan:

```json
{"service":"api","status":"ok"}
```

## 4) Integrasi dengan Vercel (Frontend)

Di project Vercel (`apps/web`) set:
- `NEXT_PUBLIC_API_BASE_URL=https://api.example.com/v1`
- `API_PROXY_TARGET=https://api.example.com/v1`

Pastikan DNS `api.example.com` mengarah ke VPS.

## 5) Catatan Operasional

- File compose prod: `infra/docker/docker-compose.vps.yml`
- Dockerfile API: `apps/api/Dockerfile`
- Nginx conf prod: `infra/nginx/api.vps.conf`
- Untuk HTTPS, letakkan SSL termination di reverse proxy (Nginx host-level / gateway eksternal) sebelum production go-live.

