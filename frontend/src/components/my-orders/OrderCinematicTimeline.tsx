import type { CSSProperties } from 'react';
import { ORDER_STATUS_FLOW, getOrderStatusLabel, type Locale } from '../../lib/servicesCatalog';
import { getFlowIndex, getStatusTheme } from '../../lib/orderTracking';
import type { OrderStatusHistoryItem } from '../../types/order';

interface OrderCinematicTimelineProps {
  status: string;
  locale: Locale;
  variant?: 'horizontal' | 'history';
  history?: OrderStatusHistoryItem[];
  noHistoryLabel?: string;
  journeyLabel?: string;
}

function formatHistoryDate(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SY' : 'en', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderCinematicTimeline({
  status,
  locale,
  variant = 'horizontal',
  history = [],
  noHistoryLabel = '',
  journeyLabel = '',
}: OrderCinematicTimelineProps) {
  const normalizedStatus = status?.toLowerCase() ?? 'pending';
  const isCancelled = normalizedStatus === 'cancelled' || normalizedStatus === 'ملغي';
  const currentIndex = getFlowIndex(status);
  const activeTheme = getStatusTheme(status);

  if (variant === 'history') {
    const sorted = [...history].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    return (
      <div className="order-cine-history">
        {journeyLabel ? <h4 className="order-cine-history__title">{journeyLabel}</h4> : null}
        {sorted.length === 0 ? (
          <p className="order-cine-history__empty">{noHistoryLabel}</p>
        ) : (
          <ol className="order-cine-history__list">
            {sorted.map((entry, index) => {
              const theme = getStatusTheme(entry.status);
              const Icon = theme.icon;
              const isLast = index === sorted.length - 1;
              return (
                <li
                  key={entry.id}
                  className={`order-cine-history__item ${isLast ? 'order-cine-history__item--current' : ''}`}
                  style={
                    {
                      '--step-color': theme.color,
                      '--step-rgb': theme.rgb,
                      '--step-delay': `${index * 0.12}s`,
                    } as CSSProperties
                  }
                >
                  <div className="order-cine-history__marker">
                    <span className="order-cine-history__icon-wrap">
                      <Icon size={16} strokeWidth={2.2} />
                    </span>
                    {!isLast ? <span className="order-cine-history__connector" aria-hidden /> : null}
                  </div>
                  <div className="order-cine-history__content">
                    <div className="order-cine-history__head">
                      <strong>{getOrderStatusLabel(entry.status, locale)}</strong>
                      <time dateTime={entry.created_at}>{formatHistoryDate(entry.created_at, locale)}</time>
                    </div>
                    {entry.notes ? <p className="order-cine-history__notes">{entry.notes}</p> : null}
                    {entry.changed_by?.name ? (
                      <span className="order-cine-history__by">
                        {locale === 'ar' ? `بواسطة ${entry.changed_by.name}` : `By ${entry.changed_by.name}`}
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    );
  }

  if (isCancelled) {
    const theme = getStatusTheme('cancelled');
    const Icon = theme.icon;
    return (
      <div
        className="order-cine-track order-cine-track--cancelled"
        style={{ '--track-accent': theme.color, '--track-rgb': theme.rgb } as CSSProperties}
      >
        <span className="order-cine-track__cancel-icon">
          <Icon size={18} />
        </span>
        <span>{getOrderStatusLabel('cancelled', locale)}</span>
      </div>
    );
  }

  return (
    <div
      className="order-cine-track order-cine-track--horizontal"
      role="progressbar"
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={ORDER_STATUS_FLOW.length}
      style={
        {
          '--track-accent': activeTheme.color,
          '--track-rgb': activeTheme.rgb,
          '--track-progress': `${getFlowIndex(status) >= 0 ? ((currentIndex + 1) / ORDER_STATUS_FLOW.length) * 100 : 0}%`,
        } as CSSProperties
      }
    >
      <div className="order-cine-track__rail" aria-hidden>
        <span className="order-cine-track__rail-fill" />
      </div>
      <div className="order-cine-track__steps">
        {ORDER_STATUS_FLOW.map((stepStatus, index) => {
          const theme = getStatusTheme(stepStatus);
          const Icon = theme.icon;
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;
          const state = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
          return (
            <div
              key={stepStatus}
              className={`order-cine-track__step order-cine-track__step--${state}`}
              style={
                {
                  '--step-color': theme.color,
                  '--step-rgb': theme.rgb,
                  '--step-delay': `${index * 0.1}s`,
                } as CSSProperties
              }
            >
              <span className="order-cine-track__node" title={getOrderStatusLabel(stepStatus, locale)}>
                <Icon size={isCurrent ? 18 : 15} strokeWidth={2.2} />
                {isCurrent ? <span className="order-cine-track__pulse" aria-hidden /> : null}
              </span>
              <span className="order-cine-track__label">{getOrderStatusLabel(stepStatus, locale)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
