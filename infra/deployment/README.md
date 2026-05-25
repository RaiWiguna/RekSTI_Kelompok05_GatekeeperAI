# Deployment (VPS + Docker)

Panduan ini untuk skenario:
- Frontend `apps/web` deploy di Vercel
- Backend + infra (API, PostgreSQL, Redis, Nginx) deploy di VPS menggunakan Docker Compose

Target VPS saat ini:
- Host: `103.31.38.237`
- User SSH: `raiDharma`
- OS: Ubuntu 24.04 LTS
- Public API sementara: `http://103.31.38.237/v1`

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

Di VPS, jalankan perintah dari root repo hasil sinkronisasi, misalnya:

```bash
cd ~/gatekeeper-ai
docker compose -f infra/docker/docker-compose.vps.yml --env-file infra/deployment/.env.vps up -d --build
```

Service yang dijalankan:
- `postgres`
- `redis`
- `migrate` (one-shot untuk `prisma migrate deploy`)
- `api`
- `face-recognition` (FastAPI + `services/face-recognition/models/model.tflite`)
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

Health check publik dari luar server:

```powershell
curl http://103.31.38.237/health
```

Respon yang diharapkan:

```json
{"service":"api","status":"ok"}
```

Face recognition health check publik:

```powershell
curl http://103.31.38.237/face/health
```

Respon yang diharapkan:

```json
{"service":"face-recognition","status":"ok","model_loaded":true,"model_type":"tflite"}
```

## 4) Integrasi dengan Vercel (Frontend)

Di project Vercel (`apps/web`) set:
- `NEXT_PUBLIC_API_BASE_URL=/api`
- `API_PROXY_TARGET=http://103.31.38.237/v1`
- `FACE_SERVICE_URL=http://103.31.38.237/face`

Pastikan DNS `api.example.com` mengarah ke VPS.

Dengan konfigurasi ini:

```text
Vercel web /api/face-recognition/detect
-> FACE_SERVICE_URL (/face)
-> Nginx VPS
-> face-recognition container
-> model.tflite
```

## 5) Catatan Operasional

- File compose prod: `infra/docker/docker-compose.vps.yml`
- Dockerfile API: `apps/api/Dockerfile`
- Nginx conf prod: `infra/nginx/api.vps.conf`
- Untuk HTTPS, letakkan SSL termination di reverse proxy (Nginx host-level / gateway eksternal) sebelum production go-live.

## 6) CI/CD GitHub Actions ke VPS

Workflow `.github/workflows/deploy-vps.yml` dapat deploy backend dan infra VPS setiap ada push ke `main` pada path backend/infra terkait.

Tambahkan GitHub Actions secrets berikut di repository:

```text
VPS_HOST=103.31.38.237
VPS_PORT=22
VPS_USER=raiDharma
VPS_PROJECT_DIR=/home/raiDharma/gatekeeper-ai
VPS_SSH_KEY=<private key SSH yang boleh login ke VPS>
```

Pastikan VPS juga bisa menjalankan `git pull origin main` dari folder project. Untuk private repository, pasang deploy key atau kredensial GitHub di VPS.

Deploy otomatis menjalankan:

```text
git pull --ff-only origin main
docker compose up postgres/redis
docker compose build api/migrate
docker compose run migrate
docker compose up api/nginx
```

Seed tidak dijalankan otomatis saat push karena dapat menimpa password akun demo. Jika perlu reset akun seed, jalankan workflow secara manual dari tab GitHub Actions dan pilih `run_seed=true`.

