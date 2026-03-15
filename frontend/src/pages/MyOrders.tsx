import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ordersAPI } from '../lib/api';
import { useTranslation } from '../i18n';
import { isAuthenticated } from '../lib/auth';
import type { OrderListItem, OrderDetail, OrderItemDetail } from '../types/order';
import { MyOrdersFilters, STATUS_FILTERS, type StatusFilter } from '../components/my-orders/MyOrdersFilters';
import { MyOrdersList } from '../components/my-orders/MyOrdersList';
import { MyOrderDetailDrawer } from '../components/my-orders/MyOrderDetailDrawer';
import './MyOrders.css';

function normalizeOrderDetail(raw: Record<string, unknown>): OrderDetail {
  const items = (raw.items as OrderItemDetail[] | undefined) ?? [];
  const firstItem = items[0];
  const specs =
    (firstItem?.specifications as Record<string, unknown> | undefined) ??
    (raw.specifications as Record<string, unknown>) ??
    {};
  const designFiles = items.flatMap((i) => {
    const df = i.design_files;
    if (!df) return [];
    return (Array.isArray(df) ? df : []).map((f) =>
      typeof f === 'string' ? f : (f as { url: string }).url,
    );
  });
  return {
    id: raw.id as string,
    order_number: raw.order_number as string,
    service_id: raw.service_id as string | undefined,
    service_name_ar: raw.service_name_ar as string | undefined,
    service_name_en: raw.service_name_en as string | undefined,
    customer_name: (raw.customer_name as string) ?? '',
    customer_phone: (raw.customer_phone as string) ?? '',
    customer_whatsapp: raw.customer_whatsapp as string | undefined,
    shop_name: raw.shop_name as string | undefined,
    status: (raw.status as string) ?? 'pending',
    final_amount: Number(raw.final_amount ?? 0),
    notes: raw.notes as string | undefined,
    delivery_type: raw.delivery_type as string | undefined,
    delivery_address: raw.delivery_address as string | undefined,
    delivery_street: raw.delivery_street as string | undefined,
    delivery_neighborhood: raw.delivery_neighborhood as string | undefined,
    delivery_building_floor: raw.delivery_building_floor as string | undefined,
    delivery_extra: raw.delivery_extra as string | undefined,
    delivery_latitude: raw.delivery_latitude != null ? Number(raw.delivery_latitude) : null,
    delivery_longitude: raw.delivery_longitude != null ? Number(raw.delivery_longitude) : null,
    files:
      designFiles.length > 0 ? designFiles : (raw.files as string[] | undefined),
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
    items: items.map((i) => ({
      id: i.id,
      product_name: i.product_name,
      quantity: i.quantity,
      total_price: i.total_price,
      specifications: i.specifications,
      design_files: i.design_files,
    })),
  };
}

export function MyOrders() {
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
  }, [navigate]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { page: number; limit: number; status?: string } = { page: 1, limit: 50 };
      if (statusFilter === 'active') params.status = 'active';
      if (statusFilter === 'completed') params.status = 'completed';
      if (statusFilter === 'cancelled') params.status = 'cancelled';
      const { data } = await ordersAPI.getOrders(params);
      const payload = data as unknown as {
        data?: OrderListItem[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
      };
      setOrders(payload.data ?? []);
      setTotal(payload.total ?? 0);
      setPage(payload.page ?? 1);
    } catch {
      setError(
        locale === 'ar' ? 'تعذر تحميل الطلبات' : 'Failed to load orders',
      );
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, locale]);

  useEffect(() => {
    if (isAuthenticated()) void loadOrders();
  }, [loadOrders]);

  const openOrderNumberFromState = (location.state as { openOrderNumber?: string } | null)?.openOrderNumber;

  useEffect(() => {
    if (!openOrderNumberFromState || loading || orders.length === 0) return;
    const order = orders.find((o) => (o.order_number ?? '').toUpperCase() === openOrderNumberFromState.toUpperCase());
    if (!order?.id) return;
    let cancelled = false;
    setDetailLoading(true);
    ordersAPI
      .getById(order.id)
      .then(({ data }) => {
        if (!cancelled) setSelectedOrder(normalizeOrderDetail(data as Record<string, unknown>));
      })
      .catch(() => {
        if (!cancelled) setSelectedOrder(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    navigate(location.pathname, { replace: true, state: {} });
    return () => {
      cancelled = true;
    };
  }, [openOrderNumberFromState, loading, orders, navigate, location.pathname]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        (o.order_number ?? '').toLowerCase().includes(q) ||
        (o.customer_name ?? '').toLowerCase().includes(q) ||
        (o.customer_phone ?? '')
          .replace(/\s/g, '')
          .includes(q.replace(/\s/g, '')),
    );
  }, [orders, search]);

  const filteredByStatus = useMemo(() => {
    if (statusFilter === 'all') return filteredOrders;
    if (statusFilter === 'active')
      return filteredOrders.filter((o) =>
        ['pending', 'confirmed', 'processing'].includes(o.status?.toLowerCase()),
      );
    return filteredOrders;
  }, [filteredOrders, statusFilter]);

  const openDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const { data } = await ordersAPI.getById(orderId);
      setSelectedOrder(normalizeOrderDetail(data as Record<string, unknown>));
    } catch {
      setSelectedOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReorder = useCallback(
    (orderId: string) => {
      setSelectedOrder(null);
      navigate(`/order/reorder/${orderId}`);
    },
    [navigate],
  );

  const myOrdersLabels = t.myOrders as {
    title: string;
    search: string;
    all: string;
    active: string;
    completed: string;
    cancelled: string;
    orderNo: string;
    service: string;
    status: string;
    date: string;
    viewDetails: string;
    empty: string;
    loading: string;
    customer: string;
    delivery: string;
    specs: string;
    files: string;
    notes: string;
    total: string;
    whatsapp: string;
    openMap: string;
    reorder: string;
  };

  if (!isAuthenticated()) return null;

  return (
    <div className="my-orders-page">
      <section className="my-orders section">
        <div className="container">
          <h1 className="my-orders__title">{myOrdersLabels.title}</h1>

          <MyOrdersFilters
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            labels={{
              search: myOrdersLabels.search,
              all: myOrdersLabels.all,
              active: myOrdersLabels.active,
              completed: myOrdersLabels.completed,
              cancelled: myOrdersLabels.cancelled,
            }}
          />

          {loading ? (
            <p className="my-orders__state">{myOrdersLabels.loading}</p>
          ) : error ? (
            <p className="my-orders__state my-orders__state--error">{error}</p>
          ) : filteredByStatus.length === 0 ? (
            <p className="my-orders__state">{myOrdersLabels.empty}</p>
          ) : (
            <MyOrdersList
              orders={filteredByStatus}
              locale={locale}
              viewDetailsLabel={myOrdersLabels.viewDetails}
              onViewDetails={openDetail}
            />
          )}
        </div>
      </section>

      {(selectedOrder || detailLoading) && (
        <div className="my-orders-overlay" onClick={() => setSelectedOrder(null)}>
          <aside className="my-orders-drawer" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="my-orders-drawer__loading">
                <div
                  className="order-page__spinner"
                  style={{ width: 36, height: 36, borderWidth: 3 }}
                />
              </div>
            ) : selectedOrder ? (
              <MyOrderDetailDrawer
                order={selectedOrder}
                locale={locale}
                labels={{
                  service: myOrdersLabels.service,
                  customer: myOrdersLabels.customer,
                  delivery: myOrdersLabels.delivery,
                  specs: myOrdersLabels.specs,
                  files: myOrdersLabels.files,
                  notes: myOrdersLabels.notes,
                  total: myOrdersLabels.total,
                  whatsapp: myOrdersLabels.whatsapp,
                  openMap: myOrdersLabels.openMap,
                  reorder: myOrdersLabels.reorder,
                }}
                onClose={() => setSelectedOrder(null)}
                onReorder={handleReorder}
              />
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
