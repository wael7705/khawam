import { X, FileText, Download, MapPin, Phone, User, Package, Truck, ExternalLink } from 'lucide-react';
import type { OrderDetail, OrderStatusHistoryItem } from '../../types/order';
import { getServiceDisplayName, getOrderStatusLabel } from '../../lib/servicesCatalog';
import { getOrderStatusClass } from './MyOrderCard';
import { OrderCinematicTimeline } from './OrderCinematicTimeline';
import { buildWhatsAppUrl } from '../../lib/orderTracking';
import { formatSpecValue, getDisplayableSpecEntries } from '../../lib/orderSpecDisplay';
import type { Locale } from '../../lib/servicesCatalog';

export interface MyOrderDetailDrawerLabels {
  service: string;
  customer: string;
  delivery: string;
  specs: string;
  files: string;
  notes: string;
  total: string;
  whatsapp: string;
  openMap: string;
  reorder: string;
  trackJourney: string;
  noHistory: string;
}

interface MyOrderDetailDrawerProps {
  order: OrderDetail;
  locale: Locale;
  labels: MyOrderDetailDrawerLabels;
  statusHistory: OrderStatusHistoryItem[];
  onClose: () => void;
  onReorder?: (orderId: string) => void;
}

export function MyOrderDetailDrawer({
  order,
  locale,
  labels,
  statusHistory,
  onClose,
  onReorder,
}: MyOrderDetailDrawerProps) {
  const isCompleted = order.status?.toLowerCase() === 'completed';
  const statusClass = getOrderStatusClass(order.status);

  const renderSpecs = (specs: Record<string, unknown>) => {
    const entries = getDisplayableSpecEntries(specs, locale);
    if (entries.length === 0) return null;
    return (
      <div className="my-orders-specs">
        <h4>{labels.specs}</h4>
        <div className="my-orders-specs__grid">
          {entries.map((entry) => (
            <div key={entry.key} className="my-orders-specs__item">
              <span className="my-orders-specs__label">{entry.label}</span>
              <span className="my-orders-specs__value">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const whatsappMessage =
    locale === 'ar'
      ? `مرحباً، أتابع طلبي #${order.order_number}`
      : `Hi, I'm following up on my order #${order.order_number}`;

  return (
    <>
      <header className="my-orders-drawer__header my-orders-drawer__header--cinematic" data-status={statusClass}>
        <div>
          <h3>#{order.order_number}</h3>
          <span className={`my-orders__card-status my-orders__card-status--${statusClass}`}>
            {getOrderStatusLabel(order.status, locale)}
          </span>
        </div>
        <button type="button" className="my-orders-drawer__close" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>
      </header>

      <div className="my-orders-drawer__body">
        <div className="my-orders-drawer__timeline-panel">
          <OrderCinematicTimeline status={order.status} locale={locale} variant="horizontal" />
        </div>

        <OrderCinematicTimeline
          status={order.status}
          locale={locale}
          variant="history"
          history={statusHistory}
          journeyLabel={labels.trackJourney}
          noHistoryLabel={labels.noHistory}
        />

        {order.service_id && (
          <div className="my-orders-drawer__section">
            <h4>
              <Package size={16} /> {labels.service}
            </h4>
            <p className="my-orders-drawer__service-name">
              {getServiceDisplayName(order.service_id, locale, { nameAr: order.service_name_ar, nameEn: order.service_name_en }).mainName} →{' '}
              {getServiceDisplayName(order.service_id, locale, { nameAr: order.service_name_ar, nameEn: order.service_name_en }).subName}
            </p>
          </div>
        )}

        <div className="my-orders-drawer__section">
          <h4>
            <User size={16} /> {labels.customer}
          </h4>
          <div className="my-orders-drawer__grid">
            <div className="my-orders-drawer__item">
              <Phone size={14} />
              <span dir="ltr">{order.customer_phone || '—'}</span>
            </div>
            {order.customer_whatsapp && (
              <div className="my-orders-drawer__item">
                <span>📱</span>
                <span dir="ltr">{order.customer_whatsapp}</span>
              </div>
            )}
            {order.shop_name && (
              <div className="my-orders-drawer__item">
                <Package size={14} />
                <span>{order.shop_name}</span>
              </div>
            )}
          </div>
        </div>

        {order.delivery_type && (
          <div className="my-orders-drawer__section">
            <h4>
              {order.delivery_type === 'delivery' ? (
                <Truck size={16} />
              ) : (
                <MapPin size={16} />
              )}{' '}
              {labels.delivery}
            </h4>
            <p>{formatSpecValue('delivery_type', order.delivery_type, locale)}</p>
            {(order.delivery_street || order.delivery_neighborhood || order.delivery_address) && (
              <p className="my-orders-drawer__address">
                {order.delivery_street} {order.delivery_neighborhood} {order.delivery_address}
              </p>
            )}
            {order.delivery_latitude != null && order.delivery_longitude != null && (
              <a
                href={`https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="my-orders-drawer__map-link"
              >
                <ExternalLink size={14} />
                {labels.openMap}
              </a>
            )}
          </div>
        )}

        {order.specifications && renderSpecs(order.specifications)}

        {order.files && order.files.length > 0 && (
          <div className="my-orders-drawer__section">
            <h4>
              <FileText size={16} /> {labels.files}
            </h4>
            <div className="my-orders-drawer__files">
              {order.files.map((url, i) => {
                const name = url.split('/').pop() || `file-${i + 1}`;
                const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
                return (
                  <div key={i} className="my-orders-drawer__file">
                    {isImage ? (
                      <img src={url} alt={name} className="my-orders-drawer__file-thumb" />
                    ) : (
                      <div className="my-orders-drawer__file-icon">
                        <FileText size={24} />
                      </div>
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="my-orders-drawer__file-dl"
                    >
                      <Download size={14} />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="my-orders-drawer__section">
            <h4>{labels.notes}</h4>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="my-orders-drawer__section my-orders-drawer__total">
          <span>{labels.total}</span>
          <strong>
            {order.final_amount.toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}
          </strong>
        </div>

        {isCompleted && onReorder && (
          <button
            type="button"
            className="btn btn-primary my-orders-drawer__reorder"
            onClick={() => onReorder(order.id)}
          >
            {labels.reorder}
          </button>
        )}

        <a
          href={buildWhatsAppUrl(whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="my-orders-drawer__whatsapp"
        >
          {labels.whatsapp}
        </a>
      </div>
    </>
  );
}
