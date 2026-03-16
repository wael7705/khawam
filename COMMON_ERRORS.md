# أخطاء شائعة وحلولها

## قاعدة البيانات

### خطأ: Can't reach database server
- تأكد من أن PostgreSQL يعمل
- تأكد من صحة `DATABASE_URL` في `.env`

### خطأ: Prisma Client not generated
```bash
pnpm db:generate
```

### خطأ: Migration failed
```bash
pnpm db:push  # للتطوير المحلي
pnpm db:migrate  # للإنتاج
```

## المصادقة

### خطأ: 401 Unauthorized
- تأكد من إرسال header: `Authorization: Bearer <token>`
- تأكد من أن الرمز غير منتهي الصلاحية

### خطأ: 403 Forbidden
- المستخدم لا يملك الصلاحيات المطلوبة
- تأكد من أن نوع المستخدم (مدير/موظف)

## رفع الملفات

### خطأ: 415 Unsupported Media Type
- **السبب:** الطلب لا يصل كـ `multipart/form-data` أو الـ proxy يغيّر الهيدرات.
- **الحل:** مسارات الرفع مسجّلة على **نفس الـ app** الذي عليه `@fastify/multipart` (الجذر) في `app.ts`؛ الملفات: `orders-upload.routes.ts` و `shared/plugins/upload.plugin.ts`.
- **العميل:** استخدم `FormData` مع حقل `file` ولا تعيّن `Content-Type` (المتصفح يضيف boundary تلقائياً). ثوابت الرفع في `frontend/src/lib/upload.ts`.

### خطأ: نوع الملف غير مسموح
- الأنواع المسموحة: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP, GIF, SVG, AI, PSD, EPS
- الحد الأقصى: 50MB

### صور الأعمال 404 (GET /uploads/general/xxx.webp Not Found)
- **السبب:** على Railway (ومثيلات السحابة المشابهة) نظام الملفات **مؤقت** — الملفات المرفوعة تُحذف عند إعادة النشر أو إعادة التشغيل.
- **الحل:** أضف **Volume** لخدمة التطبيق في Railway: Service → Volumes → Add Volume (مسار مثلاً `/data`). التطبيق يستخدم تلقائياً `RAILWAY_VOLUME_MOUNT_PATH` لحفظ الملفات في مسار دائم.

## Socket.IO

### لا تصل الإشعارات
- تأكد من الاتصال بـ `wss://domain/api/ws`
- تأكد من إرسال token في المصادقة
- تحقق من `/api/ws/status` لعدد المتصلين

## Docker والنشر

### سجلات الحاويات
- `docker logs khawam-backend-staging` أو `khawam-backend-production` لعرض السجلات
- للتحقق من الاتصال بقاعدة البيانات من داخل الحاوية: `docker exec -it khawam-backend-staging sh` ثم `pnpm exec prisma migrate status`

### سجلات Nginx
- `sudo tail -f /var/log/nginx/error.log` لمعرفة أخطاء الـ proxy
