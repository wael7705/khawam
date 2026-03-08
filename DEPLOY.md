# تجهيز النشر على السيرفر - Khawam (بدون Railway)

## حالة المستودع

- المستودع: **https://github.com/wael7705/khawam**
- الفرع الافتراضي: `main`
- تم تهيئة Git والـ commit الأول وربط `origin`.

**لرفع الملفات إلى GitHub فقط:** استخدم الملف **رفع-الى-github.md** — فيه خطوة واحدة واضحة.

---

## النشر على السيرفر (بدون Railway)

### خيار 1: VPS (سيرفر خاص بك)

على السيرفر (Linux):

```bash
# تثبيت Docker و Docker Compose (إن لم يكونا مُثبّتين)
# استنساخ المستودع
git clone https://github.com/wael7705/khawam.git
cd khawam

# إعداد .env للباك اند
cp backend/.env.example backend/.env
# عدّل backend/.env (DATABASE_URL، JWT_SECRET، إلخ)

# تشغيل PostgreSQL (مثلاً عبر Docker)
# ثم بناء وتشغيل الباك اند:
docker build -f backend/Dockerfile -t khawam-backend .
# أو استخدم docker-compose إن أضفت ملف compose لـ app + db
```

### خيار 2: منصات أخرى

- **Render / Fly.io / أي منصة تدعم Docker:** استخدم نفس `backend/Dockerfile` واجعل جذر البناء (build context) هو جذر المستودع، وعرّف `DATABASE_URL` وأي secrets من واجهة المنصة.

---

## متغيرات البيئة المهمة (الباك اند)

| المتغير | الوصف |
|--------|--------|
| `DATABASE_URL` | رابط اتصال PostgreSQL |
| `JWT_SECRET` أو ما يستخدمه الباك اند للمصادقة | سري لتوقيع الجلسات |
| `PORT` | منفذ التطبيق (افتراضي 8000 في Dockerfile) |

راجع `backend/.env.example` وملفات الإعداد في `backend/src/config` لقائمة كاملة.

---

## الفرونت اند (واجهة المستخدم)

- حالياً الباك اند يخدم الـ API؛ الفرونت اند (React/Vite) منفصل.
- للنشر: ابنِ الفرونت اند (`pnpm --filter @khawam/frontend build`) واخدم مجلد `frontend/dist` من خادم ويب (Nginx، أو من الباك اند عبر static serving)، أو انشر الفرونت اند على Vercel/Netlify ووجّه الطلبات إلى رابط API الباك اند.

بعد إكمال الرفع إلى GitHub (من ملف رفع-الى-github.md)، أنت جاهز لربط المستودع بأي سيرفر تريده وضبط المتغيرات.
