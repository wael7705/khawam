# Khawam Printing - Server Setup (Ubuntu 22.04)

دليل تهيئة سيرفر Ubuntu 22.04 من الصفر للنشر مع Docker و Nginx و Let's Encrypt.

---

## 1) تحديث السيرفر وتثبيت الحزم الأساسية

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw
```

---

## 2) تثبيت Docker و Docker Compose

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# ثم اخرج من الجلسة وأعد الدخول (أو نفّذ newgrp docker)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker --version
docker compose version
```

---

## 3) تثبيت Nginx و Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot
```

---

## 4) جدار الحماية UFW

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 5) هيكل المجلدات

```bash
sudo mkdir -p /opt/khawam-app
sudo chown -R $USER:$USER /opt/khawam-app
cd /opt/khawam-app
git clone https://github.com/wael7705/khawam.git .
mkdir -p staging production
cp deploy/env/staging.example staging/.env
cp deploy/env/production.example production/.env
nano staging/.env   # عدّل POSTGRES_PASSWORD و SECRET_KEY والنطاقات
nano production/.env
```

هيكل النشر: `backend/`, `frontend/`, `deploy/` و `staging/.env`, `production/.env` تحت `/opt/khawam-app`.

---

## 6) إعداد Nginx

استبدل `staging.example.com` و `example.com` بنطاقاتك الفعلية في الملفات ثم انسخها:

```bash
sudo nano deploy/nginx/khawam-staging.conf   # غيّر server_name
sudo nano deploy/nginx/khawam-production.conf
sudo cp deploy/nginx/khawam-staging.conf /etc/nginx/sites-available/
sudo cp deploy/nginx/khawam-production.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/khawam-staging.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/khawam-production.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7) شهادات SSL (Let's Encrypt)

بعد أن تشير النطاقات (DNS) إلى عنوان السيرفر:

```bash
sudo certbot --nginx -d staging.example.com -d example.com -d www.example.com
# اتبع التعليمات (بريد، موافقة). للتجديد التلقائي:
sudo certbot renew --dry-run
```

---

## 8) النشر الأول

```bash
cd /opt/khawam-app
chmod +x deploy/scripts/*.sh
./deploy/scripts/deploy-staging.sh
./deploy/scripts/deploy-production.sh
```

تحقق من الحاويات:

```bash
docker ps
curl -s http://127.0.0.1:3080 | head -5
curl -s http://127.0.0.1:3081/api/health
```

---

## 9) التحديث من GitHub

بعد أي تعديل على المستودع:

```bash
cd /opt/khawam-app
./deploy/scripts/update.sh both
# أو: ./deploy/scripts/update.sh staging   أو   ./deploy/scripts/update.sh production
```

---

## المنافذ الداخلية

| البيئة   | الواجهة (Frontend) | الـ API (Backend) |
|----------|---------------------|-------------------|
| Staging  | 127.0.0.1:3080      | 127.0.0.1:3081    |
| Production | 127.0.0.1:4080    | 127.0.0.1:4081    |

Nginx على المضيف يوجّه النطاقات إلى هذه المنافذ.

---

## استكشاف الأخطاء

- سجلات الحاويات: `docker logs khawam-backend-staging` أو `khawam-backend-production`
- سجلات Nginx: `sudo tail -f /var/log/nginx/error.log`
- التحقق من الاتصال بقاعدة البيانات من داخل الحاوية:  
  `docker exec -it khawam-backend-staging sh` ثم `pnpm exec prisma migrate status`
