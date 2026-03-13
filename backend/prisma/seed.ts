import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/shared/utils/password.js';

const prisma = new PrismaClient();

const ADMIN_PHONE = '0966320114';
const ADMIN_EMAIL = 'waeln4457@gmail.com';
const ADMIN_PASSWORD = 'w0966320114/s';
const ADMIN_NAME = 'مدير النظام';

async function main(): Promise<void> {
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
  if (existingByEmail ?? existingByPhone) {
    console.log('Admin user already exists (by email or phone), skipping create.');
    return;
  }

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
  console.log('Admin user created: phone=%s, email=%s', ADMIN_PHONE, ADMIN_EMAIL);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
