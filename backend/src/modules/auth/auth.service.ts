import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { hashPassword, verifyPassword, needsRehash } from '../../shared/utils/password.js';
import { normalizePhone } from '../../shared/utils/phone.js';
import { ROLES, isStaffRole } from '../../shared/types/index.js';
import type { LoginInput, RegisterInput, UpdateProfileInput, ChangePasswordInput } from './auth.schema.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '30d';

export function createAccessToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'access' },
    config.SECRET_KEY,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
}

export function createRefreshToken(userId: string): string {
  return jwt.sign(
    { sub: userId, type: 'refresh' },
    config.SECRET_KEY,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
}

export function verifyRefreshToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.SECRET_KEY) as { sub: string; type: string };
    if (payload.type !== 'refresh') return null;
    return payload.sub;
  } catch {
    return null;
  }
}

function isEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
}

function isPhone(value: string): boolean {
  const digits = value.replace(/[^\d]/g, '');
  return digits.length >= 9;
}

function resolveRole(nameAr: string | null | undefined): string {
  if (nameAr === ROLES.ADMIN) return ROLES.ADMIN;
  if (nameAr === ROLES.EMPLOYEE) return ROLES.EMPLOYEE;
  return ROLES.CUSTOMER;
}

async function findUserByUsername(username: string) {
  if (isEmail(username)) {
    return prisma.user.findFirst({
      where: {
        OR: [
          { email: username.toLowerCase() },
          { email: username },
        ],
      },
      include: { userType: true },
    });
  }

  if (isPhone(username)) {
    const normalized = normalizePhone(username);
    const variants = new Set([username, normalized]);

    if (username.startsWith('0')) {
      variants.add('963' + username.slice(1));
      variants.add('+963' + username.slice(1));
    }
    if (username.startsWith('+963')) {
      variants.add(username.slice(1));
      variants.add('0' + username.slice(4));
    }
    if (username.startsWith('963')) {
      variants.add('0' + username.slice(3));
    }

    return prisma.user.findFirst({
      where: { phone: { in: [...variants] } },
      include: { userType: true },
    });
  }

  return null;
}

export async function login(input: LoginInput) {
  const username = input.username.trim();
  const user = await findUserByUsername(username);

  if (!user) {
    throw { statusCode: 401, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: 'الحساب غير نشط' };
  }

  const validPassword = await verifyPassword(user.passwordHash, input.password);
  if (!validPassword) {
    throw { statusCode: 401, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  if (needsRehash(user.passwordHash)) {
    const newHash = await hashPassword(input.password);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });
  }

  const role = resolveRole(user.userType?.nameAr);
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'bearer',
    expires_in: 900,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role,
      is_active: user.isActive,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const userId = verifyRefreshToken(refreshToken);
  if (!userId) {
    throw { statusCode: 401, message: 'رمز التجديد غير صالح' };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userType: true },
  });

  if (!user?.isActive) {
    throw { statusCode: 401, message: 'الحساب غير نشط أو غير موجود' };
  }

  const newAccessToken = createAccessToken(user.id);
  const newRefreshToken = createRefreshToken(user.id);
  const role = resolveRole(user.userType?.nameAr);

  return {
    access_token: newAccessToken,
    refresh_token: newRefreshToken,
    token_type: 'bearer',
    expires_in: 900,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role,
      is_active: user.isActive,
    },
  };
}

export async function register(input: RegisterInput) {
  if (!input.email && !input.phone) {
    throw { statusCode: 400, message: 'يجب إدخال البريد الإلكتروني أو رقم الهاتف' };
  }

  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw { statusCode: 400, message: 'البريد الإلكتروني مستخدم بالفعل' };
    }
  }

  const normalizedPhone = input.phone ? normalizePhone(input.phone) : null;
  if (normalizedPhone) {
    const existing = await prisma.user.findFirst({
      where: { phone: normalizedPhone },
    });
    if (existing) {
      throw { statusCode: 400, message: 'رقم الهاتف مستخدم بالفعل' };
    }
  }

  let customerType = await prisma.userType.findFirst({
    where: { OR: [{ typeName: 'customer' }, { nameAr: ROLES.CUSTOMER }] },
  });

  if (!customerType) {
    customerType = await prisma.userType.create({
      data: { typeName: 'customer', nameAr: ROLES.CUSTOMER, description: 'عميل' },
    });
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email?.toLowerCase() ?? null,
      phone: normalizedPhone,
      passwordHash,
      userTypeId: customerType.id,
      isActive: true,
    },
    include: { userType: true },
  });

  return {
    success: true,
    message: 'تم إنشاء الحساب بنجاح',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: ROLES.CUSTOMER,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userType: true },
  });

  if (!user) throw { statusCode: 404, message: 'المستخدم غير موجود' };

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: resolveRole(user.userType?.nameAr),
    is_active: user.isActive,
  };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const updateData: Record<string, unknown> = {};

  if (input.name) updateData['name'] = input.name;

  if (input.email) {
    const existing = await prisma.user.findFirst({
      where: { email: input.email.toLowerCase(), NOT: { id: userId } },
    });
    if (existing) throw { statusCode: 400, message: 'البريد الإلكتروني مستخدم بالفعل' };
    updateData['email'] = input.email.toLowerCase();
  }

  if (input.phone) {
    const normalized = normalizePhone(input.phone);
    const existing = await prisma.user.findFirst({
      where: { phone: normalized, NOT: { id: userId } },
    });
    if (existing) throw { statusCode: 400, message: 'رقم الهاتف مستخدم بالفعل' };
    updateData['phone'] = normalized;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    include: { userType: true },
  });

  return {
    success: true,
    message: 'تم تحديث معلومات الحساب بنجاح',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: resolveRole(user.userType?.nameAr),
      is_active: user.isActive,
    },
  };
}

export async function changePassword(userId: string, input: ChangePasswordInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { statusCode: 404, message: 'المستخدم غير موجود' };

  const valid = await verifyPassword(user.passwordHash, input.current_password);
  if (!valid) throw { statusCode: 400, message: 'كلمة المرور الحالية غير صحيحة' };

  const newHash = await hashPassword(input.new_password);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return { success: true, message: 'تم تغيير كلمة المرور بنجاح' };
}
