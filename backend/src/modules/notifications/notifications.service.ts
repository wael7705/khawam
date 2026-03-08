import { getIO, emitToStaff, emitToCustomer } from '../../shared/plugins/socket.plugin.js';

export function getWebSocketStatus(): { connected: number } {
  try {
    const io = getIO();
    return { connected: io.engine.clientsCount };
  } catch {
    return { connected: 0 };
  }
}

export function broadcastOrderCreated(order: {
  id: string;
  order_number: string;
  status: string;
  created_at: Date;
  customer_id?: string | null;
}): void {
  const data = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
  };

  emitToStaff('order_created', data);

  if (order.customer_id) {
    emitToCustomer(order.customer_id, 'order_created', data);
  }
}

export function broadcastOrderStatusUpdate(order: {
  id: string;
  order_number: string;
  status: string;
  customer_id?: string | null;
}): void {
  const data = {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
  };

  emitToStaff('order_status_updated', data);

  if (order.customer_id) {
    emitToCustomer(order.customer_id, 'order_status_updated', data);
  }
}
