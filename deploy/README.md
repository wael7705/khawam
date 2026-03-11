# Khawam Printing – النشر (Docker + Nginx)

بنية نشر لبيئتين: **staging** و **production** على سيرفر واحد (مثلاً Hetzner VPS).

## المحتويات

| المسار | الوصف |
|--------|--------|
| `docker/` | Dockerfile للـ backend والـ frontend |
| `docker-compose.staging.yml` | حاويات staging (frontend, backend, postgres) |
| `docker-compose.production.yml` | حاويات production |
| `nginx/` | إعدادات Nginx (reverse proxy) لـ staging و production |
| `env/` | أمثلة ملفات `.env` (نسخها إلى `staging/.env` و `production/.env`) |
| `scripts/` | `deploy-staging.sh`, `deploy-production.sh`, `update.sh` |
| `SERVER-SETUP.md` | خطوات تهيئة السيرفر من الصفر |

## التشغيل من جذر المستودع

```bash
# إعداد ملفات البيئة أولاً
cp deploy/env/staging.example staging/.env
cp deploy/env/production.example production/.env
# عدّل staging/.env و production/.env

# نشر staging
./deploy/scripts/deploy-staging.sh

# نشر production
./deploy/scripts/deploy-production.sh

# تحديث من GitHub وإعادة البناء
./deploy/scripts/update.sh both
```

## التوجيه (Nginx على المضيف)

- `staging.example.com` → frontend-staging (3080) و `/api` → backend-staging (3081)
- `example.com` → frontend-production (4080) و `/api` → backend-production (4081)

راجع **SERVER-SETUP.md** لتهيئة Ubuntu و Nginx و Certbot خطوة بخطوة.
