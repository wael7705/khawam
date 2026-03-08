import type { FastifyInstance } from 'fastify';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { ROLES, isStaffRole } from '../types/index.js';
import type { JwtPayload } from '../types/index.js';

let io: Server | null = null;

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function emitToStaff(event: string, data: unknown): void {
  io?.to('staff:orders').emit(event, data);
}

export function emitToCustomer(customerId: string, event: string, data: unknown): void {
  io?.to(`customer:${customerId}`).emit(event, data);
}

export async function socketPlugin(fastify: FastifyInstance): Promise<void> {
  io = new Server(fastify.server, {
    cors: {
      origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
    path: '/api/ws',
  });

  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth['token'] as string | undefined)
        ?? (socket.handshake.query['token'] as string | undefined);

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const userByApiToken = await prisma.user.findFirst({
        where: { apiToken: token },
        include: { userType: true },
      });
      if (userByApiToken?.isActive) {
        socket.data['user'] = userByApiToken;
        socket.data['role'] = userByApiToken.userType?.nameAr ?? ROLES.CUSTOMER;
        return next();
      }

      const payload = jwt.verify(token, config.SECRET_KEY) as JwtPayload;
      if (payload.type !== 'access') {
        return next(new Error('Invalid token type'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        include: { userType: true },
      });

      if (!user?.isActive) {
        return next(new Error('Invalid token'));
      }

      socket.data['user'] = user;
      socket.data['role'] = user.userType?.nameAr ?? ROLES.CUSTOMER;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const role = socket.data['role'] as string;
    const user = socket.data['user'] as { id: string };

    if (isStaffRole(role)) {
      socket.join('staff:orders');
    } else {
      socket.join(`customer:${user.id}`);
    }

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('track-order', (orderId: string) => {
      if (!isStaffRole(role)) {
        socket.join(`order:${orderId}`);
      }
    });
  });

  fastify.addHook('onClose', () => {
    io?.close();
  });

  fastify.decorate('io', io);
}

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}
