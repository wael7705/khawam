import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ordersAPI } from '../lib/api';
import { useTranslation } from '../i18n';
import { isAuthenticated } from '../lib/auth';
import { useOrderStatusUpdates } from '../lib/socket';
import type { OrderListItem, OrderDetail, OrderItemDetail } from '../types/order';
import { MyOrdersFilters, STATUS_FILTERS, type StatusFilter } from '../components/my-orders/MyOrdersFilters';
import { MyOrdersList } from '../components/my-orders/MyOrdersList';
import { MyOrderDetailDrawer } from '../components/my-orders/MyOrderDetailDrawer';
import './MyOrders.css';

const WHATSAPP_URL = 'https://wa.me/963112134640';

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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

  useOrderStatusUpdates((payload) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === payload.id ? { ...o, status: payload.status } : o)),
    );
    setSelectedOrder((prev) =>
      prev?.id === payload.id ? { ...prev, status: payload.status } : prev,
    );
  });

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
          <div className="my-orders__head">
            <h1 className="my-orders__title">{myOrdersLabels.title}</h1>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="my-orders__whatsapp-btn"
              aria-label={myOrdersLabels.whatsapp}
            >
              <WhatsAppIcon size={22} />
              <span>{myOrdersLabels.whatsapp}</span>
            </a>
          </div>

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
