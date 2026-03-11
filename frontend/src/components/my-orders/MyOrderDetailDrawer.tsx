import { X, FileText, Download, MapPin, Phone, User, Package, Truck, ExternalLink } from 'lucide-react';
import type { OrderDetail } from '../../types/order';
import { getServiceDisplayName, getOrderStatusLabel } from '../../lib/servicesCatalog';
import { getOrderStatusClass } from './MyOrderCard';
import type { Locale } from '../../lib/servicesCatalog';

const WHATSAPP_NUMBER = '963999123456';

const SPEC_LABELS: Record<string, { ar: string; en: string }> = {
  paper_size: { ar: 'قياس الورق', en: 'Paper Size' },
  print_color: { ar: 'نوع الطباعة', en: 'Print Color' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  delivery_type: { ar: 'طريقة الاستلام', en: 'Delivery' },
};

function formatSpecValue(key: string, value: unknown, locale: string): string {
  if (value === null || value === undefined || value === '') return '';
  if (value === true) return locale === 'ar' ? 'نعم' : 'Yes';
  if (key === 'delivery_type')
    return value === 'delivery'
      ? locale === 'ar'
        ? 'توصيل'
        : 'Delivery'
      : locale === 'ar'
        ? 'استلام من المحل'
        : 'Self Pickup';
  return String(value);
}

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
}

interface MyOrderDetailDrawerProps {
  order: OrderDetail;
  locale: Locale;
  labels: MyOrderDetailDrawerLabels;
  onClose: () => void;
  onReorder?: (orderId: string) => void;
}

export function MyOrderDetailDrawer({
  order,
  locale,
  labels,
  onClose,
  onReorder,
}: MyOrderDetailDrawerProps) {
  const isCompleted = order.status?.toLowerCase() === 'completed';

  const renderSpecs = (specs: Record<string, unknown>) => {
    const skipKeys = [
      'files',
      'clothing_designs',
      'service_id',
      'customer_name',
      'customer_whatsapp',
      'customer_phone',
      'shop_name',
      'delivery_address',
      'notes',
      'total_pages',
      'number_of_pages',
    ];
    const entries = Object.entries(specs).filter(([k, v]) => {
      if (skipKeys.includes(k)) return false;
      const formatted = formatSpecValue(k, v as string, locale);
      return formatted !== '';
    });
    if (entries.length === 0) return null;
    return (
      <div className="my-orders-specs">
        <h4>{labels.specs}</h4>
        <div className="my-orders-specs__grid">
          {entries.map(([k, v]) => (
            <div key={k} className="my-orders-specs__item">
              <span className="my-orders-specs__label">
                {SPEC_LABELS[k]?.[locale === 'ar' ? 'ar' : 'en'] ?? k}
              </span>
              <span className="my-orders-specs__value">{formatSpecValue(k, v, locale)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <header className="my-orders-drawer__header">
        <div>
          <h3>#{order.order_number}</h3>
          <span
            className={`my-orders__card-status my-orders__card-status--${getOrderStatusClass(order.status)}`}
          >
            {getOrderStatusLabel(order.status, locale)}
          </span>
        </div>
        <button type="button" className="my-orders-drawer__close" onClick={onClose}>
          <X size={20} />
        </button>
      </header>

      <div className="my-orders-drawer__body">
        {order.service_id && (
          <div className="my-orders-drawer__section">
            <h4>
              <Package size={16} /> {labels.service}
            </h4>
            <p className="my-orders-drawer__service-name">
              {getServiceDisplayName(order.service_id, locale).mainName} →{' '}
              {getServiceDisplayName(order.service_id, locale).subName}
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

        {(order.customer_whatsapp || order.customer_phone) && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
              locale === 'ar'
                ? `مرحباً، أتابع طلبي #${order.order_number}`
                : `Hi, I'm following up on my order #${order.order_number}`,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary my-orders-drawer__whatsapp"
          >
            {labels.whatsapp}
          </a>
        )}
      </div>
    </>
  );
}
