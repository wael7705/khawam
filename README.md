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
# عدل DATABASE_URL في backend/.env

# توليد Prisma Client
pnpm db:generate

# تشغيل المهاجرات
pnpm db:migrate

# التشغيل في وضع التطوير
pnpm dev
```

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

## النشر

المشروع مُهيّأ للنشر على Railway عبر Docker.

```bash
git push origin main
```
