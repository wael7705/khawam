import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  advanceMockOrderStatus,
  canUseDashboardMockData,
  dashboardApi,
  type AdminOrdersResponse,
  type ServicePricingCoverage,
} from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './OrdersManagement.css';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'processing', 'completed', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function getStatusClass(status: string): string {
  const normalized = status.toLowerCase();
  if (['completed', 'مكتمل'].includes(normalized)) return 'done';
  if (['pending', 'confirmed', 'processing', 'قيد التنفيذ', 'مؤكد'].includes(normalized)) return 'active';
  if (['cancelled', 'ملغي'].includes(normalized)) return 'cancel';
  return 'neutral';
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function OrdersManagement() {
  const { locale } = useTranslation();
  const useMockData = canUseDashboardMockData();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<AdminOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({ total: 0, active: 0, today: 0 });
  const [pricingCoverage, setPricingCoverage] = useState<ServicePricingCoverage[]>([]);

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'إدارة الطلبات',
            subtitle: 'إدارة سريعة لحالة الطلبات مع واجهة متوافقة مع التصميم الجديد.',
            search: 'ابحث برقم الطلب أو اسم العميل أو الهاتف',
            all: 'الكل',
            pending: 'قيد الانتظار',
            confirmed: 'مؤكد',
            processing: 'قيد المعالجة',
            completed: 'مكتمل',
            cancelled: 'ملغي',
            orderNo: 'رقم الطلب',
            customer: 'العميل',
            status: 'الحالة',
            amount: 'الإجمالي',
            created: 'تاريخ الإنشاء',
            paid: 'الدفع',
            yes: 'مدفوع',
            no: 'غير مدفوع',
            totalOrders: 'إجمالي الطلبات',
            activeOrders: 'الطلبات النشطة',
            todayOrders: 'طلبات اليوم',
            prev: 'السابق',
            next: 'التالي',
            empty: 'لا توجد طلبات مطابقة للفلاتر الحالية.',
            loading: 'تحميل الطلبات...',
            failed: 'تعذر تحميل الطلبات',
            nextStatus: 'المرحلة التالية',
            actions: 'إجراء',
            mockHint: 'وضع بيانات وهمية مفعل (بدون سيرفر)',
            pricingWarningPrefix: 'تنبيه تسعير:',
          }
        : {
            title: 'Orders Management',
            subtitle: 'Manage and track orders in a modern responsive interface.',
            search: 'Search by order number, customer, or phone',
            all: 'All',
            pending: 'Pending',
            confirmed: 'Confirmed',
            processing: 'Processing',
            completed: 'Completed',
            cancelled: 'Cancelled',
            orderNo: 'Order #',
            customer: 'Customer',
            status: 'Status',
            amount: 'Total',
            created: 'Created At',
            paid: 'Payment',
            yes: 'Paid',
            no: 'Unpaid',
            totalOrders: 'Total Orders',
            activeOrders: 'Active Orders',
            todayOrders: 'Today Orders',
            prev: 'Previous',
            next: 'Next',
            empty: 'No orders found for current filters.',
            loading: 'Loading orders...',
            failed: 'Failed to load orders',
            nextStatus: 'Next status',
            actions: 'Action',
            mockHint: 'Mock mode enabled (no server)',
            pricingWarningPrefix: 'Pricing warning:',
          },
    [locale],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadOrders = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersRes, stats, todayRes, coverageRes] = await Promise.all([
          dashboardApi.getOrders({
            status: status === 'all' ? undefined : status,
            search: query || undefined,
            page,
            limit: 20,
          }),
          dashboardApi.getStats(),
          dashboardApi.getOrders({
            date_from: todayIsoDate(),
            date_to: todayIsoDate(),
            page: 1,
            limit: 1,
          }),
          dashboardApi.getServicePricingCoverage(),
        ]);

        setOrders(ordersRes);
        setTotals({
          total: stats.total_orders,
          active: stats.pending_orders,
          today: todayRes.total,
        });
        setPricingCoverage(coverageRes.filter((item) => !item.has_pricing));
      } catch {
        setError(labels.failed);
      } finally {
        setLoading(false);
      }
    }, [labels.failed, page, query, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [status, query]);

  const handleNextStatus = async (orderId: string) => {
    if (!useMockData) return;
    advanceMockOrderStatus(orderId);
    await loadOrders();
  };

  return (
    <div className="orders-page">
      <header className="orders-page__head">
        <div>
          <h1>{labels.title}</h1>
          <p>{labels.subtitle}</p>
        </div>
        <div className="orders-summary">
          <article>
            <span>{labels.totalOrders}</span>
            <strong>{totals.total}</strong>
          </article>
          <article>
            <span>{labels.activeOrders}</span>
            <strong>{totals.active}</strong>
          </article>
          <article>
            <span>{labels.todayOrders}</span>
            <strong>{totals.today}</strong>
          </article>
        </div>
      </header>
      {useMockData && <p className="orders-mock-hint">{labels.mockHint}</p>}
      {pricingCoverage.length > 0 && (
        <p className="orders-pricing-warning">
          {labels.pricingWarningPrefix} {pricingCoverage.map((item) => item.service_name_ar).join('، ')}
        </p>
      )}

      <section className="orders-controls">
        <div className="orders-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={labels.search} />
        </div>
        <div className="orders-tabs">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={status === item ? 'orders-tab orders-tab--active' : 'orders-tab'}
              onClick={() => setStatus(item)}
            >
              {labels[item]}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="orders-state">{labels.loading}</div>
      ) : error ? (
        <div className="orders-state orders-state--error">{error}</div>
      ) : !orders || orders.data.length === 0 ? (
        <div className="orders-state">{labels.empty}</div>
      ) : (
        <section className="orders-table-card">
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>{labels.orderNo}</th>
                  <th>{labels.customer}</th>
                  <th>{labels.status}</th>
                  <th>{labels.amount}</th>
                  <th>{labels.created}</th>
                  <th>{labels.paid}</th>
                  {useMockData && <th>{labels.actions}</th>}
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>
                      <strong>{order.customer_name}</strong>
                      <span>{order.customer_phone}</span>
                    </td>
                    <td>
                      <span className={`order-status order-status--${getStatusClass(order.status)}`}>{order.status}</span>
                    </td>
                    <td>{order.final_amount.toLocaleString()}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>{order.is_paid ? labels.yes : labels.no}</td>
                    {useMockData && (
                      <td>
                        <button
                          type="button"
                          className="orders-next-status"
                          onClick={() => void handleNextStatus(order.id)}
                          disabled={order.status === 'completed'}
                        >
                          {labels.nextStatus}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="orders-pagination">
            <button type="button" disabled={orders.page <= 1} onClick={() => setPage((prev) => prev - 1)}>
              {labels.prev}
            </button>
            <span>
              {orders.page} / {orders.totalPages}
            </span>
            <button
              type="button"
              disabled={orders.page >= orders.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              {labels.next}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
