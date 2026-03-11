# Khawam - نظام إدارة الطباعة والتصميم

نظام متكامل لإدارة خدمات الطباعة والتصميم، مبني بتقنيات حديثة عالية الأداء.

## التقنيات

### الباك اند
- **Fastify** - إطار عمل Node.js عالي الأداء
- **TypeScript** - وضع strict
- **Prisma ORM** - PostgreSQL
- **Socket.IO** - اتصال فوري
- **Zod** - التحقق من المدخلات
- **Argon2** - تشفير كلمات المرور
- **Sharp** - معالجة الصور

### قاعدة البيانات
- PostgreSQL

## المتطلبات

- Node.js >= 20
- pnpm >= 8
- PostgreSQL

## التشغيل

```bash
# تثبيت الحزم
pnpm install

# إعداد قاعدة البيانات
cp backend/.env.example backend/.env
# عدّل DATABASE_URL في backend/.env (اتصال PostgreSQL)

# توليد Prisma Client
pnpm db:generate

# الرفع الأول لقاعدة البيانات (من schema فقط)
cd backend && pnpm exec prisma db push
# أو: إنشاء migration أولي ثم تنفيذه على السيرفر:
# pnpm exec prisma migrate dev --name init
# ثم على السيرفر: pnpm exec prisma migrate deploy

# بعد الرفع الأول، أي تغيير لاحق على schema:
# 1. عدّل backend/prisma/schema.prisma
# 2. أنشئ migration: pnpm exec prisma migrate dev --name وصف_التغيير
# 3. على السيرفر: pnpm exec prisma migrate deploy

# التشغيل في وضع التطوير
pnpm dev          # يشغّل الخادم فقط (المنفذ 8000)
pnpm dev:frontend # يشغّل الواجهة فقط (المنفذ 5173)
pnpm dev:all      # يشغّل الخادم والواجهة معاً (تطوير كامل)
```

**ملاحظة:** إذا لم يبدأ الخادم، تأكد من وجود `backend/.env` وضبط `DATABASE_URL` لاتصال PostgreSQL صالح. بدونها يتوقف الخادم فوراً.

## البنية

```
khawam/
├── backend/
│   ├── src/
│   │   ├── config/         # إعدادات التطبيق وقاعدة البيانات
│   │   ├── modules/        # وحدات API (auth, orders, admin, ...)
│   │   ├── algorithms/     # خوارزميات الأعمال (التسعير، أرقام الطلبات)
│   │   ├── shared/         # أدوات مشتركة (cache, middleware, plugins)
│   │   ├── jobs/           # المهام المجدولة
│   │   ├── app.ts          # إعداد Fastify
│   │   └── server.ts       # نقطة الدخول
│   └── prisma/
│       └── schema.prisma   # مخطط قاعدة البيانات
└── README.md
```

## نقاط API الرئيسية

| المسار | الوصف |
|--------|-------|
| `/api/auth/*` | المصادقة |
| `/api/orders/*` | الطلبات |
| `/api/products/*` | المنتجات |
| `/api/services/*` | الخدمات |
| `/api/admin/*` | لوحة التحكم |
| `/api/portfolio/*` | معرض الأعمال |
| `/api/studio/*` | أدوات التصميم |
| `/api/workflows/*` | سير العمل |
| `/api/pricing-rules/*` | التسعير |
| `/api/hero-slides/*` | الشرائح |
| `/api/analytics/*` | التحليلات |
| `/api/ws/*` | الاتصال الفوري |

## ضبط استهلاك الذاكرة والأداء

- **الذاكرة:** التشغيل مع حد أقصى للـ heap (مثلاً `NODE_OPTIONS=--max-old-space-size=512`) يحدّ من استهلاك الذاكرة. لتحليل التسريبات: شغّل الخادم بـ `node --inspect dist/server.js` ثم استخدم Chrome DevTools (chrome://inspect) لأخذ heap snapshots ومقارنتها تحت حمل.
- **التحميل:** اختبارات التحميل بـ k6: من جذر المشروع `pnpm test:load` (يتطلب تثبيت [k6](https://k6.io)). التفاصيل في `load-tests/README.md`.

## النشر

المشروع مُهيّأ للنشر على Railway عبر Docker.

```bash
git push origin main
```
