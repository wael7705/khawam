import { Radio, Package, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface OrderTrackingHeroProps {
  title: string;
  subtitle: string;
  liveLabel: string;
  stats: { total: number; active: number; completed: number };
  statsLabels: { orders: string; active: string; completed: string };
  children: ReactNode;
}

export function OrderTrackingHero({
  title,
  subtitle,
  liveLabel,
  stats,
  statsLabels,
  children,
}: OrderTrackingHeroProps) {
  return (
    <header className="order-track-hero">
      <div className="order-track-hero__mesh" aria-hidden>
        <span className="order-track-hero__orb order-track-hero__orb--1" />
        <span className="order-track-hero__orb order-track-hero__orb--2" />
        <span className="order-track-hero__orb order-track-hero__orb--3" />
      </div>
      <div className="order-track-hero__inner">
        <div className="order-track-hero__badge">
          <Radio size={14} className="order-track-hero__badge-icon" />
          <span>{liveLabel}</span>
        </div>
        <h1 className="order-track-hero__title">{title}</h1>
        <p className="order-track-hero__subtitle">{subtitle}</p>

        <div className="order-track-hero__stats">
          <div className="order-track-hero__stat">
            <Package size={18} />
            <div>
              <strong>{stats.total}</strong>
              <span>{statsLabels.orders}</span>
            </div>
          </div>
          <div className="order-track-hero__stat order-track-hero__stat--active">
            <Radio size={18} />
            <div>
              <strong>{stats.active}</strong>
              <span>{statsLabels.active}</span>
            </div>
          </div>
          <div className="order-track-hero__stat order-track-hero__stat--done">
            <CheckCircle2 size={18} />
            <div>
              <strong>{stats.completed}</strong>
              <span>{statsLabels.completed}</span>
            </div>
          </div>
        </div>

        <div className="order-track-hero__controls">{children}</div>
      </div>
    </header>
  );
}
