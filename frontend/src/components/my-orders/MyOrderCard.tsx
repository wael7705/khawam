import type { CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Package2 } from 'lucide-react';
import type { OrderListItem } from '../../types/order';
import { getServiceDisplayName, getOrderStatusLabel } from '../../lib/servicesCatalog';
import { getStatusTheme, getProgressPercent } from '../../lib/orderTracking';
import { OrderCinematicTimeline } from './OrderCinematicTimeline';
import type { Locale } from '../../lib/servicesCatalog';

export function getOrderStatusClass(status: string): string {
  const normalized = status?.toLowerCase() ?? '';
  if (['pending', 'confirmed', 'processing', 'completed', 'cancelled'].includes(normalized)) {
    return normalized;
  }
  if (['completed', 'مكتمل'].includes(normalized)) return 'completed';
  if (['pending', 'confirmed', 'processing'].includes(normalized)) return normalized || 'pending';
  if (['cancelled', 'ملغي'].includes(normalized)) return 'cancelled';
  return 'pending';
}

interface MyOrderCardProps {
  order: OrderListItem;
  locale: Locale;
  viewDetailsLabel: string;
  onViewDetails: (orderId: string) => void;
  animationIndex?: number;
}

export function MyOrderCard({
  order,
  locale,
  viewDetailsLabel,
  onViewDetails,
  animationIndex = 0,
}: MyOrderCardProps) {
  const statusClass = getOrderStatusClass(order.status);
  const theme = getStatusTheme(order.status);
  const progress = getProgressPercent(order.status);
  const StatusIcon = theme.icon;
  const isRtl = locale === 'ar';
  const Chevron = isRtl ? ChevronLeft : ChevronRight;

  return (
    <article
      className="my-orders__card my-orders__card--cinematic"
      data-status={statusClass}
      style={
        {
          '--card-accent': theme.color,
          '--card-rgb': theme.rgb,
          '--card-delay': `${animationIndex * 0.09}s`,
        } as CSSProperties
      }
    >
      <div className="my-orders__card-glow" aria-hidden />

      <div className="my-orders__card-top">
        <div className="my-orders__card-id-wrap">
          <Package2 size={15} className="my-orders__card-spark" aria-hidden />
          <span className="my-orders__card-id">#{order.order_number}</span>
        </div>
        <span
          className={`my-orders__card-status my-orders__card-status--${statusClass} ${statusClass !== 'completed' && statusClass !== 'cancelled' ? 'my-orders__card-status--live' : ''}`}
        >
          <StatusIcon size={13} strokeWidth={2.5} aria-hidden />
          {getOrderStatusLabel(order.status, locale)}
        </span>
      </div>

      <div className="my-orders__card-live-bar" aria-hidden>
        <span
          className="my-orders__card-live-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="my-orders__card-service">
        {getServiceDisplayName(order.service_id, locale, {
          nameAr: order.service_name_ar,
          nameEn: order.service_name_en,
        }).subName}
      </p>

      <OrderCinematicTimeline status={order.status} locale={locale} variant="horizontal" />

      <div className="my-orders__card-meta">
        <span className="my-orders__card-date">
          {new Date(order.created_at).toLocaleDateString(locale === 'ar' ? 'ar-SY' : 'en', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
        <span className="my-orders__card-amount">
          {order.final_amount.toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}
        </span>
        <span className="my-orders__card-progress" aria-hidden>
          {progress}%
        </span>
      </div>

      <button
        type="button"
        className="my-orders__card-btn"
        onClick={() => onViewDetails(order.id)}
      >
        <span>{viewDetailsLabel}</span>
        <Chevron size={18} />
      </button>
    </article>
  );
}
