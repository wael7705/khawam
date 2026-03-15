import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { getAuthToken } from './auth';

const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:8000/api';

/** Base URL for Socket.IO (origin only, no /api path). */
function getSocketBaseUrl(): string {
  const url = API_URL.trim();
  if (url.endsWith('/api')) return url.slice(0, -4);
  if (url.endsWith('/api/')) return url.slice(0, -5);
  return url.replace(/\/api\/?$/, '');
}

export interface OrderStatusUpdatedPayload {
  id: string;
  order_number: string;
  status: string;
}

/**
 * Subscribes to real-time order status updates via Socket.IO.
 * Connects only when the user has a token; disconnects on unmount or when token is cleared.
 */
export function useOrderStatusUpdates(onStatusUpdate: (payload: OrderStatusUpdatedPayload) => void): void {
  const callbackRef = useRef(onStatusUpdate);
  callbackRef.current = onStatusUpdate;

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const socket: Socket = io(getSocketBaseUrl(), {
      path: '/api/ws',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const handler = (payload: OrderStatusUpdatedPayload) => {
      callbackRef.current(payload);
    };

    socket.on('order_status_updated', handler);

    return () => {
      socket.off('order_status_updated', handler);
      socket.disconnect();
    };
  }, []);
}
