import { PrismaClient } from '@prisma/client';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const prisma = new PrismaClient();

const ADMIN_PHONE = '0966320114';
const ADMIN_EMAIL = 'waeln4457@gmail.com';
const ADMIN_PASSWORD = 'w0966320114/s';
const ADMIN_NAME = 'مدير النظام';

async function main(): Promise<void> {
  console.log('[seed] بدء تهيئة البيانات...');

  const distPath = join(__dirname, '..', 'dist', 'shared', 'utils', 'password.js');
  const srcPath = join(__dirname, '..', 'src', 'shared', 'utils', 'password.js');
  const loadPassword = (path: string) => import(pathToFileURL(path).href);
  const passwordModule =
    process.env.NODE_ENV === 'production'
      ? await loadPassword(distPath)
      : await loadPassword(srcPath).catch(() => loadPassword(distPath));
  const hashPassword = passwordModule.hashPassword as (p: string) => Promise<string>;

  const userTypes = [
    { typeName: 'admin', nameAr: 'مدير', description: 'مدير النظام' },
    { typeName: 'employee', nameAr: 'موظف', description: 'موظف' },
    { typeName: 'customer', nameAr: 'عميل', description: 'عميل' },
  ];

  for (const ut of userTypes) {
    await prisma.userType.upsert({
      where: { typeName: ut.typeName },
      create: ut,
      update: { nameAr: ut.nameAr, description: ut.description },
    });
  }

  const adminType = await prisma.userType.findUnique({
    where: { typeName: 'admin' },
  });
  if (!adminType) throw new Error('UserType admin not found after upsert');

  const existingByEmail = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL.toLowerCase() },
  });
  const existingByPhone = await prisma.user.findFirst({
    where: { phone: ADMIN_PHONE },
  });
  if (!existingByEmail && !existingByPhone) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        phone: ADMIN_PHONE,
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        userTypeId: adminType.id,
        isActive: true,
      },
    });
    console.log('[seed] تم إنشاء حساب المدير: هاتف=%s، بريد=%s', ADMIN_PHONE, ADMIN_EMAIL);
  } else {
    console.log('Admin user already exists (by email or phone), skipping create.');
  }

  // ضمان وجود الخدمات وخطوات الـ workflow بعد كل نشر
  const { importLegacyServicesSeed } = await import(
    '../src/modules/services/services.service.js'
  );
  const legacy = await importLegacyServicesSeed();
  console.log(
    '[seed] استيراد الخدمات والـ workflow: created=%s, updated=%s, workflow steps=%s',
    legacy.created,
    legacy.updated,
    legacy.workflows,
  );

  // تطبيق خوارزميات الـ workflow الكاملة من WORKFLOW_MAP (stepType + stepConfig)
  const { seedAllWorkflows } = await import(
    '../src/modules/workflows/workflows.service.js'
  );
  const wfResult = await seedAllWorkflows();
  console.log(
    '[seed] تطبيق خوارزميات الـ workflow: seeded=%s, errors=%s',
    wfResult.seeded,
    wfResult.errors?.length ?? 0,
  );
  if (wfResult.errors?.length) {
    wfResult.errors.forEach((err) => console.warn('[seed] workflow error:', err));
  }

  // ملء قاعدة مالية كاملة لكل خدمة (أبعاد وشرائح أسعار افتراضية؛ يبقى تعديل الأرقام من لوحة التسعير)
  const { seedFullFinancialPricing } = await import(
    '../src/modules/pricing/pricing.service.js'
  );
  const pricingResult = await seedFullFinancialPricing();
  console.log(
    '[seed] القاعدة المالية: created=%s, skipped=%s, errors=%s',
    pricingResult.created,
    pricingResult.skipped,
    pricingResult.errors?.length ?? 0,
  );
  if (pricingResult.errors?.length) {
    pricingResult.errors.forEach((err) => console.warn('[seed] pricing error:', err));
  }
}

main()
  .then(async () => {
    console.log('[seed] انتهت التهيئة بنجاح.');
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('[seed] فشل:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
