import type { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate } from '../../shared/middleware/auth.middleware.js';
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from './auth.schema.js';
import * as authService from './auth.service.js';
import { config } from '../../config/index.js';

const REFRESH_COOKIE = 'khawam_refresh';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function cookieSecure(): boolean {
  return config.NODE_ENV === 'production';
}

function setRefreshCookie(reply: FastifyReply, token: string): void {
  const secure = cookieSecure();
  const securePart = secure ? '; Secure' : '';
  void reply.header('Set-Cookie',
    `${REFRESH_COOKIE}=${token}; HttpOnly${securePart}; SameSite=Strict; Path=/api/auth/refresh; Max-Age=${COOKIE_MAX_AGE / 1000}`,
  );
}

function clearRefreshCookie(reply: FastifyReply): void {
  const secure = cookieSecure();
  const securePart = secure ? '; Secure' : '';
  void reply.header('Set-Cookie',
    `${REFRESH_COOKIE}=; HttpOnly${securePart}; SameSite=Strict; Path=/api/auth/refresh; Max-Age=0`,
  );
}

function extractRefreshToken(request: { headers: { cookie?: string } }): string | null {
  const cookies = request.headers.cookie;
  if (!cookies) return null;
  const match = cookies.match(new RegExp(`${REFRESH_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    try {
      const result = await authService.login(body);
      setRefreshCookie(reply, result.refresh_token);
      const { refresh_token: _rt, ...response } = result;
      return response;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/refresh', async (request, reply) => {
    try {
      const refreshToken = extractRefreshToken(request);
      if (!refreshToken) {
        return reply.code(401).send({ detail: 'رمز التجديد مفقود' });
      }
      const result = await authService.refreshAccessToken(refreshToken);
      setRefreshCookie(reply, result.refresh_token);
      const { refresh_token: _rt, ...response } = result;
      return response;
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      clearRefreshCookie(reply);
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      return await authService.getProfile(request.user!.id);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.post('/logout', async (_request, reply) => {
    clearRefreshCookie(reply);
    return { message: 'تم تسجيل الخروج بنجاح' };
  });

  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    try {
      return await authService.register(body);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put('/profile', { preHandler: [authenticate] }, async (request, reply) => {
    const body = updateProfileSchema.parse(request.body);
    try {
      return await authService.updateProfile(request.user!.id, body);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });

  app.put('/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const body = changePasswordSchema.parse(request.body);
    try {
      return await authService.changePassword(request.user!.id, body);
    } catch (err: unknown) {
      const error = err as { statusCode?: number; message?: string };
      return reply.code(error.statusCode ?? 500).send({ detail: error.message });
    }
  });
}
