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

# بعد أول نشر أو بعد migrate deploy — إنشاء أنواع المستخدمين وحساب المدير:
# من مجلد backend (مع ضبط DATABASE_URL في .env أو على السيرفر):
# pnpm exec prisma db seed
# المدير: هاتف 0966320114، إيميل waeln4457@gmail.com، كلمة مرور w0966320114/s

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

**نشر واحد على Railway:** يُبنى الـ frontend داخل صورة Docker ويُخدم من نفس الخدمة. عند فتح رابط خدمة khawam تحصل على الموقع الكامل (الواجهة + تسجيل الدخول + طلباتي + لوحة التحكم) دون الحاجة لسيرفر آخر. في هذه الحالة ضع `FRONTEND_URL` مساوياً لـ `PUBLIC_BASE_URL` (نفس رابط الخدمة).

**قبل الدفع (مهم):** إذا غيّرت `package.json` أو `backend/package.json` في أي وقت، شغّل من جذر المشروع `pnpm install` ثم ارفع ملف `pnpm-lock.yaml` مع التغييرات. قبل الدفع شغّل `pnpm run build` من مجلد backend (أو `pnpm build` من الجذر) للتأكد من نجاح البناء. البناء على Railway يستخدم `--frozen-lockfile` ويتوقف إذا كان القفل غير مطابق لـ package.json.

```bash
git push origin main
```

### متغيرات البيئة على Railway (مشروع خوام)

يمكن ضبط المتغيرات من لوحة Railway (المشروع خوام → الخدمة → Variables) أو عبر **Railway CLI** أو عبر **سكربت جاهز**:

**مهم:** المتغيرات (SECRET_KEY، PUBLIC_BASE_URL، FRONTEND_URL، …) تُضبط على خدمة **khawam** (التطبيق) فقط، وليس على خدمة Postgres. خدمة Postgres تبقى بمتغيراتها الافتراضية؛ وربطها بخدمة khawam يحقن `DATABASE_URL` تلقائياً في khawam.

**ضبط من لوحة Railway (موصى به):** من المشروع خوام → انقر خدمة **khawam** (أيقونة GitHub) وليس Postgres → Variables → Raw Editor → الصق المتغيرات من الملف `backend/scripts/railway-variables-khawam-service.txt` (أو أضفها يدوياً). عدّل `PUBLIC_BASE_URL` و `FRONTEND_URL` إذا كان عنوان نشرك مختلفاً.

**ضبط سريع عبر السكربت (من مجلد backend):**
1. تثبيت CLI إن لزم: `npm i -g @railway/cli`
2. مرة واحدة: `railway login` (يفتح المتصفح)، ثم `railway link` — **تأكد من اختيار خدمة khawam (التطبيق) وليس Postgres.**
3. تشغيل السكربت: `.\scripts\railway-set-variables.ps1`  
   السكربت يضبط `SECRET_KEY`، `PUBLIC_BASE_URL`، `FRONTEND_URL`، `NODE_ENV`، `PORT`. عدّل العنوانين داخل السكربت أو عبر `RAILWAY_PUBLIC_BASE_URL` و `RAILWAY_FRONTEND_URL` قبل التشغيل.

**ضبط يدوي عبر CLI:**
1. تثبيت CLI: `npm i -g @railway/cli`
2. تسجيل الدخول: `railway login`
3. الربط بالمشروع: من مجلد الباكند `cd backend` ثم `railway link` واختيار مشروع خوام ثم خدمة التطبيق (خوام).
4. ضبط متغيرات **خدمة خوام (التطبيق)**:
   ```bash
   railway variables set SECRET_KEY=قيمة_قوية_32_حرف
   railway variables set PUBLIC_BASE_URL=https://عنوان-الـapi.railway.app
   railway variables set FRONTEND_URL=https://عنوان-الواجهة
   railway variables set NODE_ENV=production
   railway variables set REMOVE_BG_API_KEY=...   # اختياري
   railway variables set UPLOAD_DIR=/data/uploads # اختياري عند استخدام Volume
   ```

**خدمة قاعدة البيانات (PostgreSQL):** لا تحتاج ضبط متغيرات يدوي — عند إضافة PostgreSQL من لوحة Railway وربطها بخدمة خوام، يُحقَن `DATABASE_URL` تلقائياً في خدمة التطبيق.

| المتغير | مطلوب | الوصف |
|---------|-------|--------|
| `DATABASE_URL` | نعم | يُحقَن تلقائياً عند ربط خدمة PostgreSQL بخدمة التطبيق |
| `SECRET_KEY` | نعم | مفتاح سري قوي (مثلاً 32 حرف عشوائي) للمصادقة والجلسات |
| `PORT` | لا | المنفذ (عادة Railway يضبطه تلقائياً) |
| `PUBLIC_BASE_URL` | نعم | عنوان الـ API العام، مثال: `https://khawam-backend.up.railway.app` |
| `FRONTEND_URL` | نعم | عنوان الواجهة. عند النشر الواحد (الواجهة من نفس الخدمة) ضعه مساوياً لـ `PUBLIC_BASE_URL` |
| `REMOVE_BG_API_KEY` | لا | مفتاح [remove.bg](https://remove.bg) لاستديو إزالة الخلفية |
| `UPLOAD_DIR` | لا | مجلد حفظ الملفات المرفوعة. مع Volume: `/data/uploads` |
| `NODE_ENV` | لا | `production` في النشر |

**الرفع إلى السيرفر:** الخادم يحفظ الملفات المرفوعة في المجلد المُعرّف بـ `UPLOAD_DIR`، أو في `./uploads` إن لم يُضبَط. لاستمرارية الملفات على Railway أضف Volume واربطه بمسار (مثل `/data`) ثم ضبط `UPLOAD_DIR=/data/uploads`.

### التحقق بعد النشر

- **تسجيل دخول المدير:** بعد تشغيل `prisma db seed` (من مجلد backend مع ضبط DATABASE_URL)، سجّل الدخول من الواجهة بـ 0966320114 أو waeln4457@gmail.com وكلمة المرور w0966320114/s. تحقق من عمل لوحة التحكم.
- **إنشاء طلب:** أنشئ طلباً من الواجهة (كعميل أو ضيف). تحقق في قاعدة البيانات من وجود سجل في `orders` و `order_items` و `order_status_history` (حالة pending وملاحظة "تم إنشاء الطلب").
- **تغيير الحالة:** من لوحة التحكم (مدير/موظف) غيّر حالة الطلب (مثلاً إلى confirmed ثم completed). تحقق من تحديث `orders.status` ووجود سجلات جديدة في `order_status_history`.
- **تسجيل الخروج:** بعد تسجيل الخروج تحقق أن طلب `/api/auth/refresh` يرجع 401 وأن الـ cookie مُمسحة.
