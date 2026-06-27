import type { OrderListItem } from '../../types/order';
import { MyOrderCard } from './MyOrderCard';
import type { Locale } from '../../lib/servicesCatalog';

interface MyOrdersListProps {
  orders: OrderListItem[];
  locale: Locale;
  viewDetailsLabel: string;
  onViewDetails: (orderId: string) => void;
}

export function MyOrdersList({
  orders,
  locale,
  viewDetailsLabel,
  onViewDetails,
}: MyOrdersListProps) {
  return (
    <div className="my-orders__list my-orders__list--cinematic">
      {orders.map((order, index) => (
        <MyOrderCard
          key={order.id}
          order={order}
          locale={locale}
          viewDetailsLabel={viewDetailsLabel}
          onViewDetails={onViewDetails}
          animationIndex={index}
        />
      ))}
    </div>
  );
}
