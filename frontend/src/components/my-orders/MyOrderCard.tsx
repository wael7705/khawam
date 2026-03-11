import type { OrderListItem } from '../../types/order';
import { getServiceDisplayName, getOrderStatusLabel } from '../../lib/servicesCatalog';
import type { Locale } from '../../lib/servicesCatalog';

export function getOrderStatusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (['completed', 'مكتمل'].includes(normalized)) return 'done';
  if (['pending', 'confirmed', 'processing'].includes(normalized)) return 'active';
  if (['cancelled', 'ملغي'].includes(normalized)) return 'cancel';
  return 'neutral';
}

interface MyOrderCardProps {
  order: OrderListItem;
  locale: Locale;
  viewDetailsLabel: string;
  onViewDetails: (orderId: string) => void;
}

export function MyOrderCard({ order, locale, viewDetailsLabel, onViewDetails }: MyOrderCardProps) {
  return (
    <article className="my-orders__card">
      <div className="my-orders__card-main">
        <span className="my-orders__card-id">#{order.order_number}</span>
        <span className={`my-orders__card-status my-orders__card-status--${getOrderStatusClass(order.status)}`}>
          {getOrderStatusLabel(order.status, locale)}
        </span>
        <span className="my-orders__card-service">
          {getServiceDisplayName(order.service_id, locale).subName}
        </span>
        <span className="my-orders__card-date">
          {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en')}
        </span>
      </div>
      <button
        type="button"
        className="btn btn-primary my-orders__card-btn"
        onClick={() => onViewDetails(order.id)}
      >
        {viewDetailsLabel}
      </button>
    </article>
  );
}
