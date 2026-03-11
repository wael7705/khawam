# اختبارات التحميل (Load Tests)

استخدام **k6** لقياس قدرة النظام على تحمّل عدد كبير من الطلبات.

## المتطلبات

- تثبيت [k6](https://k6.io/docs/get-started/installation/) (مثلاً: `choco install k6` على Windows أو من الموقع الرسمي).

## التشغيل

- تشغيل الـ backend أولاً (مثلاً `pnpm dev:backend`).
- من جذر المشروع:

```bash
k6 run load-tests/load.js
```

- مع تحديد عنوان السيرفر:

```bash
k6 run -e BASE_URL=http://localhost:8000 load-tests/load.js
```

- رفع عدد المستخدمين الافتراضيين والمدة (مثلاً 50 مستخدم لمدة 60 ثانية):

```bash
k6 run --vus 50 --duration 60s load-tests/load.js
```

## المسارات المُختبرة

- `GET /api/services`: قائمة الخدمات (بدون auth).
- `POST /api/orders`: إنشاء طلب بحد أدنى من البيانات.

## النتائج

k6 يطبع ملخصاً يتضمن معدل الطلبات (RPS)، زمن الاستجابة (p50, p95)، ونسبة الفشل. استخدمها لقياس تحمّل النظام وسرعة الاستجابة.
