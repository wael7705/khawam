import type { OrderListItem } from '../../types/order';
import { getServiceDisplayName, getOrderStatusLabel, ORDER_STATUS_FLOW } from '../../lib/servicesCatalog';
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
  const normalizedStatus = order.status?.toLowerCase() ?? '';
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'ملغي';
  const currentIndex = isCancelled ? -1 : ORDER_STATUS_FLOW.indexOf(normalizedStatus as 'pending' | 'confirmed' | 'processing' | 'completed');

  return (
    <article className="my-orders__card">
      <div className="my-orders__card-main">
        <span className="my-orders__card-id">#{order.order_number}</span>
        <span className={`my-orders__card-status my-orders__card-status--${getOrderStatusClass(order.status)}`}>
          {getOrderStatusLabel(order.status, locale)}
        </span>
        <span className="my-orders__card-service">
          {getServiceDisplayName(order.service_id, locale, { nameAr: order.service_name_ar, nameEn: order.service_name_en }).subName}
        </span>
        <span className="my-orders__card-date">
          {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en')}
        </span>
      </div>

      {isCancelled ? (
        <div className="my-orders__status-track my-orders__status-track--cancelled" aria-hidden>
          <span className="my-orders__status-track-label">{getOrderStatusLabel('cancelled', locale)}</span>
        </div>
      ) : (
        <div className="my-orders__status-track" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={ORDER_STATUS_FLOW.length}>
          {ORDER_STATUS_FLOW.map((status, index) => {
            const isDone = currentIndex > index;
            const isCurrent = currentIndex === index;
            return (
              <div key={status} className="my-orders__status-track-step">
                <div className="my-orders__status-track-dots">
                  <span
                    className={`my-orders__status-track-dot ${isDone ? 'my-orders__status-track-dot--done' : ''} ${isCurrent ? 'my-orders__status-track-dot--current' : ''}`}
                    title={getOrderStatusLabel(status, locale)}
                  />
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <span className={`my-orders__status-track-line ${currentIndex > index ? 'my-orders__status-track-line--done' : ''}`} />
                  )}
                </div>
                <span className="my-orders__status-track-label">{getOrderStatusLabel(status, locale)}</span>
              </div>
            );
          })}
        </div>
      )}

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
