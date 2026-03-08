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

### خطأ: نوع الملف غير مسموح
- الأنواع المسموحة: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP, GIF, SVG, AI, PSD, EPS
- الحد الأقصى: 50MB

## Socket.IO

### لا تصل الإشعارات
- تأكد من الاتصال بـ `wss://domain/api/ws`
- تأكد من إرسال token في المصادقة
- تحقق من `/api/ws/status` لعدد المتصلين
