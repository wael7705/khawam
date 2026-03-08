import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { ROLES, isStaffRole } from '../types/index.js';
import type { AuthUser, JwtPayload, UserRole } from '../types/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

function extractToken(request: FastifyRequest): string | null {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

function resolveRole(nameAr: string | null | undefined): UserRole {
  if (nameAr === ROLES.ADMIN) return ROLES.ADMIN;
  if (nameAr === ROLES.EMPLOYEE) return ROLES.EMPLOYEE;
  return ROLES.CUSTOMER;
}

async function resolveUser(token: string): Promise<AuthUser | null> {
  const userByApiToken = await prisma.user.findFirst({
    where: { apiToken: token },
    include: { userType: true },
  });
  if (userByApiToken?.isActive) {
    return {
      id: userByApiToken.id,
      phone: userByApiToken.phone ?? '',
      name: userByApiToken.name,
      email: userByApiToken.email,
      role: resolveRole(userByApiToken.userType?.nameAr),
      isActive: true,
    };
  }

  try {
    const payload = jwt.verify(token, config.SECRET_KEY) as JwtPayload;
    if (payload.type !== 'access') return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userType: true },
    });
    if (!user?.isActive) return null;

    return {
      id: user.id,
      phone: user.phone ?? '',
      name: user.name,
      email: user.email,
      role: resolveRole(user.userType?.nameAr),
      isActive: true,
    };
  } catch {
    return null;
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const token = extractToken(request);
  if (!token) {
    return reply.code(401).send({ detail: 'غير مصرح' });
  }

  const user = await resolveUser(token);
  if (!user) {
    return reply.code(401).send({ detail: 'رمز غير صالح' });
  }

  request.user = user;
}

export async function optionalAuth(
  request: FastifyRequest,
): Promise<void> {
  const token = extractToken(request);
  if (!token) return;

  const user = await resolveUser(token);
  if (user) {
    request.user = user;
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authenticate(request, reply);
    if (reply.sent) return;

    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({ detail: 'صلاحيات غير كافية' });
    }
  };
}
