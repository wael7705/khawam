import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, FileText, Download, MapPin, Phone, User, Package, Truck, ExternalLink, Copy, Share2, Ban, Check, CheckCircle, Cog, StickyNote, Banknote } from 'lucide-react';
import {
  advanceMockOrderStatus,
  canUseDashboardMockData,
  dashboardApi,
  setMockOrderCancelled,
  type AdminOrdersResponse,
  type ServicePricingCoverage,
} from '../../lib/dashboard-api';
import { api } from '../../lib/api';
import { useTranslation } from '../../i18n';
import {
  getServiceDisplayName,
  getOrderStatusLabel,
  getNextOrderStatus,
  getOrderStatusActionLabel,
  ORDER_CANCEL_ACTION_LABELS,
} from '../../lib/servicesCatalog';
import type { LucideIcon } from 'lucide-react';

function getOrderStatusNextIcon(currentStatus: string, nextStatus: string): LucideIcon {
  const curr = currentStatus?.toLowerCase();
  if (curr === 'pending' && nextStatus === 'confirmed') return Check;
  if (curr === 'confirmed' && nextStatus === 'processing') return Package;
  if (curr === 'processing' && nextStatus === 'completed') return CheckCircle;
  return Cog;
}
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

interface OrderItemDetail {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  specifications?: Record<string, unknown>;
  design_files?: string[] | Array<{ url: string }>;
}

interface OrderDetail {
  id: string;
  order_number: string;
  service_id?: string;
  service_name_ar?: string;
  service_name_en?: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp?: string;
  shop_name?: string;
  status: string;
  final_amount: number;
  total_amount?: number;
  is_paid: boolean;
  paid_amount?: number;
  remaining_amount?: number;
  staff_notes?: string;
  created_at: string;
  notes?: string;
  delivery_type?: string;
  delivery_address?: string;
  delivery_street?: string;
  delivery_neighborhood?: string;
  delivery_building_floor?: string;
  delivery_extra?: string;
  delivery_latitude?: number | null;
  delivery_longitude?: number | null;
  files?: string[];
  specifications?: Record<string, unknown>;
  items: OrderItemDetail[];
}

/** Normalize phone to WhatsApp international format (digits only; 0 prefix → 963 for Syria). */
function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits.length) return '';
  if (digits.startsWith('0')) return '963' + digits.slice(1);
  if (!digits.startsWith('963') && digits.length <= 10) return '963' + digits;
  return digits;
}

function buildShareText(orderNumber: string, customerName: string, address: string, lat: number, lon: number, locale: string): string {
  const parts = [
    locale === 'ar' ? `طلب #${orderNumber}` : `Order #${orderNumber}`,
    customerName ? (locale === 'ar' ? `العميل: ${customerName}` : `Customer: ${customerName}`) : '',
    address || '',
    `${lat},${lon}`,
  ].filter(Boolean);
  return parts.join('\n');
}

const SPEC_LABELS: Record<string, { ar: string; en: string }> = {
  paper_size: { ar: 'قياس الورق', en: 'Paper Size' },
  print_color: { ar: 'نوع الطباعة', en: 'Print Color' },
  print_quality: { ar: 'جودة الطباعة', en: 'Quality' },
  print_sides: { ar: 'طباعة الوجه', en: 'Sides' },
  booklet: { ar: 'كتيب', en: 'Booklet' },
  width: { ar: 'العرض', en: 'Width' },
  height: { ar: 'الارتفاع', en: 'Height' },
  dimensions: { ar: 'الأبعاد', en: 'Dimensions' },
  dimensions_unit: { ar: 'وحدة الأبعاد', en: 'Dimensions unit' },
  paper_type: { ar: 'نوع الورق', en: 'Paper Type' },
  card_type: { ar: 'نوع البطاقة', en: 'Card Type' },
  binding_type: { ar: 'نوع التجليد', en: 'Binding' },
  binding_color: { ar: 'لون التجليد', en: 'Binding Color' },
  text_color: { ar: 'لون الكتابة', en: 'Text Color' },
  cover_print_type: { ar: 'نوع طباعة الغلاف', en: 'Cover Print' },
  clothing_source: { ar: 'مصدر الملابس', en: 'Clothing Source' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  delivery_type: { ar: 'طريقة الاستلام', en: 'Delivery' },
};

/** يحافظ على الواحدات (مم، سم، م) عند عرض الأبعاد */
function formatSpecValue(
  key: string,
  value: unknown,
  locale: string,
  contextSpecs?: Record<string, unknown>,
): string {
  if (value === null || value === undefined || value === '' || value === false) return '';
  if (value === true) return locale === 'ar' ? 'نعم' : 'Yes';
  if (key === 'print_color') return value === 'bw' ? (locale === 'ar' ? 'أبيض وأسود' : 'B&W') : (locale === 'ar' ? 'ألوان' : 'Color');
  if (key === 'print_sides') return value === 'single' ? (locale === 'ar' ? 'وجه واحد' : 'Single') : (locale === 'ar' ? 'وجهين' : 'Double');
  if (key === 'delivery_type') return value === 'delivery' ? (locale === 'ar' ? 'توصيل' : 'Delivery') : (locale === 'ar' ? 'استلام من المحل' : 'Self Pickup');
  if (key === 'clothing_source') return value === 'customer' ? (locale === 'ar' ? 'من العميل' : 'Customer') : (locale === 'ar' ? 'من المتجر' : 'Store');
  if (key === 'width' || key === 'height' || key === 'dimensions') {
    if (typeof value === 'string') return value || '';
    if (typeof value === 'number') {
      if (value === 0) return ''; // لا نعرض الأبعاد عندما تكون غير مستخدمة (مثل خدمة طباعة المحاضرات)
      const unit = (contextSpecs?.dimensions_unit as string) ?? (contextSpecs?.unit as string) ?? (locale === 'ar' ? 'سم' : 'cm');
      return `${value} ${unit}`;
    }
  }
  return String(value);
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
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [staffNotesDraft, setStaffNotesDraft] = useState('');
  const [savingStaffNotes, setSavingStaffNotes] = useState(false);
  const [paymentIsPaid, setPaymentIsPaid] = useState(true);
  const [paymentPaidAmount, setPaymentPaidAmount] = useState(0);
  const [savingPayment, setSavingPayment] = useState(false);

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'إدارة الطلبات',
            subtitle: 'إدارة سريعة لحالة الطلبات مع واجهة متوافقة مع التصميم الجديد.',
            search: 'ابحث برقم الطلب أو اسم العميل أو الهاتف',
            all: 'الكل',
            pending: getOrderStatusLabel('pending', 'ar'),
            confirmed: getOrderStatusLabel('confirmed', 'ar'),
            processing: getOrderStatusLabel('processing', 'ar'),
            completed: getOrderStatusLabel('completed', 'ar'),
            cancelled: getOrderStatusLabel('cancelled', 'ar'),
            orderNo: 'رقم الطلب',
            service: 'الخدمة',
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
            cancelOrder: 'إلغاء الطلب',
            actions: 'إجراء',
            mockHint: 'وضع بيانات وهمية مفعل (بدون سيرفر)',
            pricingWarningPrefix: 'تنبيه تسعير:',
          }
        : {
            title: 'Orders Management',
            subtitle: 'Manage and track orders in a modern responsive interface.',
            search: 'Search by order number, customer, or phone',
            all: 'All',
            pending: getOrderStatusLabel('pending', 'en'),
            confirmed: getOrderStatusLabel('confirmed', 'en'),
            processing: getOrderStatusLabel('processing', 'en'),
            completed: getOrderStatusLabel('completed', 'en'),
            cancelled: getOrderStatusLabel('cancelled', 'en'),
            orderNo: 'Order #',
            service: 'Service',
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
            cancelOrder: 'Cancel order',
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
            page: 1,
            limit: 500,
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
    }, [labels.failed, query, status]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);


  useEffect(() => {
    if (selectedOrder) {
      setStaffNotesDraft(selectedOrder.staff_notes ?? '');
      setPaymentIsPaid(selectedOrder.is_paid);
      setPaymentPaidAmount(selectedOrder.paid_amount ?? selectedOrder.final_amount ?? 0);
    }
  }, [selectedOrder]);

  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    try {
      if (useMockData) {
        advanceMockOrderStatus(orderId);
      } else {
        await dashboardApi.updateOrderStatus(orderId, nextStatus);
      }
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
    } catch {
      setError(locale === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const msg = locale === 'ar' ? 'هل تريد إلغاء هذا الطلب؟' : 'Do you want to cancel this order?';
    if (!window.confirm(msg)) return;
    try {
      if (useMockData) {
        setMockOrderCancelled(orderId);
      } else {
        await dashboardApi.updateOrderStatus(orderId, 'cancelled');
      }
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch {
      setError(locale === 'ar' ? 'فشل إلغاء الطلب' : 'Failed to cancel order');
    }
  };

  const handleSaveStaffNotes = async () => {
    if (!selectedOrder || useMockData) return;
    setSavingStaffNotes(true);
    try {
      await dashboardApi.updateOrderStaffNotes(selectedOrder.id, staffNotesDraft);
      setSelectedOrder((prev) => (prev ? { ...prev, staff_notes: staffNotesDraft } : null));
    } catch {
      setDetailError(locale === 'ar' ? 'فشل حفظ الملاحظات' : 'Failed to save notes');
    } finally {
      setSavingStaffNotes(false);
    }
  };

  const handleSavePayment = async () => {
    if (!selectedOrder || useMockData) return;
    setSavingPayment(true);
    try {
      const isPaid = paymentIsPaid;
      const paidAmount = isPaid ? (selectedOrder.final_amount ?? 0) : paymentPaidAmount;
      await dashboardApi.updateOrderPaid(selectedOrder.id, { is_paid: isPaid, paid_amount: paidAmount });
      const remaining = (selectedOrder.final_amount ?? 0) - paidAmount;
      setSelectedOrder((prev) =>
        prev ? { ...prev, is_paid: isPaid, paid_amount: paidAmount, remaining_amount: remaining } : null
      );
    } catch {
      setDetailError(locale === 'ar' ? 'فشل تحديث التسديد' : 'Failed to update payment');
    } finally {
      setSavingPayment(false);
    }
  };

  function normalizeOrderDetail(raw: Record<string, unknown>): OrderDetail {
    const items = (raw.items as OrderItemDetail[] | undefined) ?? [];
    const firstItem = items[0];
    const specs: Record<string, unknown> = (firstItem?.specifications as Record<string, unknown> | undefined) ?? (raw.specifications as Record<string, unknown> | undefined) ?? ({} as Record<string, unknown>);
    const designFiles = items.flatMap((i) => {
      const df = i.design_files;
      if (!df) return [];
      return (Array.isArray(df) ? df : []).map((f) => (typeof f === 'string' ? f : (f as { url: string }).url));
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
      total_amount: raw.total_amount != null ? Number(raw.total_amount) : undefined,
      is_paid: Boolean(raw.is_paid),
      paid_amount: raw.paid_amount != null ? Number(raw.paid_amount) : undefined,
      remaining_amount: raw.remaining_amount != null ? Number(raw.remaining_amount) : undefined,
      staff_notes: raw.staff_notes as string | undefined,
      created_at: (raw.created_at as string) ?? '',
      notes: raw.notes as string | undefined,
      delivery_type: raw.delivery_type as string | undefined,
      delivery_address: raw.delivery_address as string | undefined,
      delivery_street: raw.delivery_street as string | undefined,
      delivery_neighborhood: raw.delivery_neighborhood as string | undefined,
      delivery_building_floor: raw.delivery_building_floor as string | undefined,
      delivery_extra: raw.delivery_extra as string | undefined,
      delivery_latitude: raw.delivery_latitude != null ? Number(raw.delivery_latitude) : null,
      delivery_longitude: raw.delivery_longitude != null ? Number(raw.delivery_longitude) : null,
      files: designFiles.length > 0 ? designFiles : (raw.files as string[] | undefined),
      specifications: Object.keys(specs).length > 0 ? specs : undefined,
      items: items.map((i) => ({
        id: i.id,
        product_name: i.product_name,
        quantity: i.quantity,
        total_price: i.total_price,
        specifications: (i.specifications ?? undefined) as unknown as Record<string, unknown> | undefined,
        design_files: i.design_files,
      })),
    };
  }

  const openOrderDetail = async (orderId: string) => {
    setDetailError('');
    setDetailLoading(true);
    setSelectedOrder(null);
    try {
      const data = useMockData
        ? await api.get(`/orders/${orderId}`).then((r) => r.data as Record<string, unknown>)
        : await dashboardApi.getOrderById(orderId);
      setSelectedOrder(normalizeOrderDetail(data as Record<string, unknown>));
    } catch {
      if (useMockData) {
        const row = orders?.data.find((o) => o.id === orderId);
        if (row) {
          setSelectedOrder({
            ...row,
            customer_whatsapp: '',
            files: [],
            specifications: {},
            notes: '',
            delivery_type: '',
            delivery_address: '',
            items: row.items?.map((i) => ({ ...i, specifications: undefined, design_files: undefined })) ?? [],
          });
        }
      } else {
        setDetailError(locale === 'ar' ? 'فشل تحميل تفاصيل الطلب' : 'Failed to load order details');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const renderSpecs = (specs: Record<string, unknown>) => {
    const entries = Object.entries(specs).filter(([k, v]) => {
      if (['files', 'clothing_designs', 'uploadedFileResults', 'service_id', 'customer_name', 'customer_whatsapp', 'customer_phone_extra', 'shop_name', 'delivery_address', 'notes', 'total_pages', 'number_of_pages', 'dimensions_unit', 'unit'].includes(k)) return false;
      const formatted = formatSpecValue(k, v, locale, specs);
      if (formatted === '' || formatted === '0') return false;
      if ((k === 'width' || k === 'height' || k === 'dimensions') && (v === 0 || v === null || v === undefined || v === '')) return false;
      return true;
    });
    if (entries.length === 0) return null;
    return (
      <div className="detail-specs">
        <h4>{locale === 'ar' ? 'مواصفات الطلب' : 'Order Specifications'}</h4>
        <div className="detail-specs__grid">
          {entries.map(([k, v]) => (
            <div key={k} className="detail-specs__item">
              <span className="detail-specs__label">{SPEC_LABELS[k]?.[locale === 'ar' ? 'ar' : 'en'] ?? k}</span>
              <span className="detail-specs__value">{formatSpecValue(k, v, locale, specs)}</span>
            </div>
          ))}
        </div>
      </div>
    );
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
                  <th>{labels.service}</th>
                  <th>{labels.customer}</th>
                  <th>{labels.status}</th>
                  <th>{labels.amount}</th>
                  <th>{labels.created}</th>
                  <th>{labels.paid}</th>
                  <th>{labels.actions}</th>
                </tr>
              </thead>
              <tbody>
                {orders.data.map((order) => {
                  const nextStatus = getNextOrderStatus(order.status);
                  const isPending = order.status?.toLowerCase() === 'pending';
                  return (
                    <tr key={order.id} onClick={() => void openOrderDetail(order.id)} className="orders-table__clickable">
                      <td>{order.order_number}</td>
                      <td>{getServiceDisplayName(order.service_id, locale, { nameAr: order.service_name_ar, nameEn: order.service_name_en }).subName}</td>
                      <td>
                        <strong>{order.customer_name}</strong>
                        {(order.customer_whatsapp || order.customer_phone) && (() => {
                          const num = toWhatsAppNumber(order.customer_whatsapp || order.customer_phone);
                          const display = order.customer_whatsapp || order.customer_phone;
                          if (!num) return <span dir="ltr">{display}</span>;
                          return (
                            <a
                              href={`https://wa.me/${num}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="orders-phone-link"
                              dir="ltr"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {display}
                            </a>
                          );
                        })()}
                      </td>
                      <td>
                        <span className={`order-status order-status--${getStatusClass(order.status)}`}>{getOrderStatusLabel(order.status, locale)}</span>
                      </td>
                      <td>{order.final_amount.toLocaleString()}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>{order.is_paid ? labels.yes : labels.no}</td>
                      <td className="orders-actions-cell" onClick={(e) => e.stopPropagation()}>
                        {nextStatus != null && (() => {
                          const StatusIcon = getOrderStatusNextIcon(order.status, nextStatus);
                          const isAccept = order.status?.toLowerCase() === 'pending' && nextStatus === 'confirmed';
                          return (
                            <button
                              type="button"
                              className={isAccept ? 'orders-status-icon orders-status-icon--accept' : 'orders-status-icon orders-status-icon--next'}
                              title={getOrderStatusActionLabel(order.status, locale)}
                              onClick={() => void handleAdvanceStatus(order.id, nextStatus)}
                              aria-label={getOrderStatusActionLabel(order.status, locale)}
                            >
                              <StatusIcon size={18} />
                            </button>
                          );
                        })()}
                        {isPending && (
                          <button
                            type="button"
                            className="orders-status-icon orders-status-icon--cancel"
                            title={locale === 'ar' ? ORDER_CANCEL_ACTION_LABELS.ar : ORDER_CANCEL_ACTION_LABELS.en}
                            onClick={() => void handleCancelOrder(order.id)}
                            aria-label={locale === 'ar' ? ORDER_CANCEL_ACTION_LABELS.ar : ORDER_CANCEL_ACTION_LABELS.en}
                          >
                            <Ban size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Order Detail Drawer */}
      {(selectedOrder || detailLoading || detailError) && (
        <div className="order-detail-overlay" onClick={() => { setSelectedOrder(null); setDetailError(''); }}>
          <aside className="order-detail-drawer" onClick={(e) => e.stopPropagation()}>
            {detailLoading ? (
              <div className="order-detail__loading">
                <div className="order-page__spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
              </div>
            ) : detailError ? (
              <div className="order-detail__error">
                <p>{detailError}</p>
                <button type="button" className="btn btn-primary" onClick={() => { setSelectedOrder(null); setDetailError(''); }}>
                  {locale === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            ) : selectedOrder && (
              <>
                <header className="order-detail__header">
                  <div>
                    <h3>#{selectedOrder.order_number}</h3>
                    <span className={`order-status order-status--${getStatusClass(selectedOrder.status)}`}>
                      {getOrderStatusLabel(selectedOrder.status, locale)}
                    </span>
                  </div>
                  <div className="order-detail__header-actions">
                    {getNextOrderStatus(selectedOrder.status) != null && (() => {
                      const next = getNextOrderStatus(selectedOrder.status)!;
                      const StatusIcon = getOrderStatusNextIcon(selectedOrder.status, next);
                      const isAccept = selectedOrder.status?.toLowerCase() === 'pending' && next === 'confirmed';
                      return (
                        <button
                          type="button"
                          className={isAccept ? 'orders-status-icon orders-status-icon--accept' : 'orders-status-icon orders-status-icon--next'}
                          title={getOrderStatusActionLabel(selectedOrder.status, locale)}
                          onClick={() => void handleAdvanceStatus(selectedOrder.id, next)}
                          aria-label={getOrderStatusActionLabel(selectedOrder.status, locale)}
                        >
                          <StatusIcon size={20} />
                        </button>
                      );
                    })()}
                    {selectedOrder.status?.toLowerCase() === 'pending' && (
                      <button
                        type="button"
                        className="orders-status-icon orders-status-icon--cancel"
                        title={locale === 'ar' ? ORDER_CANCEL_ACTION_LABELS.ar : ORDER_CANCEL_ACTION_LABELS.en}
                        onClick={() => void handleCancelOrder(selectedOrder.id)}
                        aria-label={locale === 'ar' ? ORDER_CANCEL_ACTION_LABELS.ar : ORDER_CANCEL_ACTION_LABELS.en}
                      >
                        <Ban size={20} />
                      </button>
                    )}
                    <button type="button" className="order-detail__close" onClick={() => setSelectedOrder(null)}>
                      <X size={20} />
                    </button>
                  </div>
                </header>

                <div className="order-detail__body">
                  {/* Service */}
                  {selectedOrder.service_id && (
                    <div className="detail-section">
                      <h4><Package size={16} /> {locale === 'ar' ? 'الخدمة' : 'Service'}</h4>
                      <p className="detail-service-name">
                        {getServiceDisplayName(selectedOrder.service_id, locale, { nameAr: selectedOrder.service_name_ar, nameEn: selectedOrder.service_name_en }).mainName}
                        {' → '}
                        {getServiceDisplayName(selectedOrder.service_id, locale, { nameAr: selectedOrder.service_name_ar, nameEn: selectedOrder.service_name_en }).subName}
                      </p>
                    </div>
                  )}

                  {/* Customer Info */}
                  <div className="detail-section">
                    <h4><User size={16} /> {locale === 'ar' ? 'بيانات العميل' : 'Customer Info'}</h4>
                    <div className="detail-info-grid">
                      <div className="detail-info-item">
                        <User size={14} />
                        <span>{selectedOrder.customer_name || '—'}</span>
                      </div>
                      {(() => {
                        const phone = selectedOrder.customer_whatsapp || selectedOrder.customer_phone;
                        const num = phone ? toWhatsAppNumber(phone) : '';
                        return (
                          <div className="detail-info-item">
                            <Phone size={14} />
                            {num ? (
                              <a href={`https://wa.me/${num}`} target="_blank" rel="noopener noreferrer" className="orders-phone-link" dir="ltr">
                                {phone}
                              </a>
                            ) : (
                              <span dir="ltr">—</span>
                            )}
                          </div>
                        );
                      })()}
                      {selectedOrder.shop_name && (
                        <div className="detail-info-item">
                          <Package size={14} />
                          <span>{selectedOrder.shop_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery */}
                  {selectedOrder.delivery_type && (
                    <div className="detail-section detail-section--delivery">
                      <h4>
                        {selectedOrder.delivery_type === 'delivery' ? <Truck size={16} /> : <MapPin size={16} />}
                        {' '}{locale === 'ar' ? 'الاستلام' : 'Delivery'}
                      </h4>
                      <p className="detail-delivery-type">
                        {formatSpecValue('delivery_type', selectedOrder.delivery_type, locale)}
                      </p>
                      {(selectedOrder.delivery_street || selectedOrder.delivery_neighborhood || selectedOrder.delivery_building_floor || selectedOrder.delivery_extra) && (
                        <div className="detail-delivery-parts">
                          {selectedOrder.delivery_street && <p className="detail-delivery-line"><span className="detail-delivery-part-label">{locale === 'ar' ? 'الشارع:' : 'Street:'}</span> {selectedOrder.delivery_street}</p>}
                          {selectedOrder.delivery_neighborhood && <p className="detail-delivery-line"><span className="detail-delivery-part-label">{locale === 'ar' ? 'الحي:' : 'Neighborhood:'}</span> {selectedOrder.delivery_neighborhood}</p>}
                          {selectedOrder.delivery_building_floor && <p className="detail-delivery-line"><span className="detail-delivery-part-label">{locale === 'ar' ? 'المبنى/الطابق:' : 'Building/Floor:'}</span> {selectedOrder.delivery_building_floor}</p>}
                          {selectedOrder.delivery_extra && <p className="detail-delivery-line"><span className="detail-delivery-part-label">{locale === 'ar' ? 'تفاصيل:' : 'Details:'}</span> {selectedOrder.delivery_extra}</p>}
                        </div>
                      )}
                      {selectedOrder.delivery_address && (
                        <p className="detail-delivery-address">{selectedOrder.delivery_address}</p>
                      )}
                      {selectedOrder.delivery_type === 'delivery' &&
                        selectedOrder.delivery_latitude != null &&
                        selectedOrder.delivery_longitude != null && (
                          <div className="detail-map-wrap">
                            <iframe
                              title={locale === 'ar' ? 'موقع التوصيل' : 'Delivery location'}
                              className="detail-map-iframe"
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedOrder.delivery_longitude - 0.008},${selectedOrder.delivery_latitude - 0.005},${selectedOrder.delivery_longitude + 0.008},${selectedOrder.delivery_latitude + 0.005}&layer=mapnik&marker=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`}
                            />
                            <div className="detail-map-actions">
                              <a
                                className="detail-map-link"
                                href={`https://www.google.com/maps?q=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink size={14} />
                                {locale === 'ar' ? 'فتح Google Maps' : 'Open Google Maps'}
                              </a>
                              <a
                                className="detail-map-link"
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <MapPin size={14} />
                                {locale === 'ar' ? 'اتجاهات GPS' : 'Directions'}
                              </a>
                              <button
                                type="button"
                                className="detail-map-link"
                                onClick={() => {
                                  const text = `${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`;
                                  void navigator.clipboard.writeText(text);
                                }}
                              >
                                <Copy size={14} />
                                {locale === 'ar' ? 'نسخ الإحداثيات' : 'Copy coords'}
                              </button>
                              <button
                                type="button"
                                className="detail-map-link"
                                onClick={() => {
                                  const url = `https://www.google.com/maps?q=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`;
                                  void navigator.clipboard.writeText(url);
                                }}
                              >
                                <ExternalLink size={14} />
                                {locale === 'ar' ? 'نسخ رابط الموقع' : 'Copy map link'}
                              </button>
                              <button
                                type="button"
                                className="detail-map-link"
                                onClick={() => {
                                  const shareText = buildShareText(
                                    selectedOrder.order_number,
                                    selectedOrder.customer_name ?? '',
                                    selectedOrder.delivery_address ?? '',
                                    selectedOrder.delivery_latitude!,
                                    selectedOrder.delivery_longitude!,
                                    locale,
                                  );
                                  if (navigator.share) {
                                    void navigator.share({
                                      title: locale === 'ar' ? `طلب #${selectedOrder.order_number}` : `Order #${selectedOrder.order_number}`,
                                      text: shareText,
                                    });
                                  } else {
                                    void navigator.clipboard.writeText(shareText);
                                  }
                                }}
                              >
                                <Share2 size={14} />
                                {locale === 'ar' ? 'مشاركة الموقع' : 'Share location'}
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Specifications */}
                  {selectedOrder.specifications && renderSpecs(selectedOrder.specifications)}

                  {/* Items */}
                  {selectedOrder.items.length > 0 && (
                    <div className="detail-section">
                      <h4><Package size={16} /> {locale === 'ar' ? 'عناصر الطلب' : 'Order Items'}</h4>
                      <div className="detail-items">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="detail-item-row">
                            <span className="detail-item-name">{item.product_name}</span>
                            <span className="detail-item-qty">×{item.quantity}</span>
                            <span className="detail-item-price">{item.total_price.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files */}
                  {selectedOrder.files && selectedOrder.files.length > 0 && (
                    <div className="detail-section">
                      <h4><FileText size={16} /> {locale === 'ar' ? 'الملفات المرفقة' : 'Attached Files'}</h4>
                      <div className="detail-files">
                        {selectedOrder.files.map((fileUrl, i) => {
                          const name = fileUrl.split('/').pop() || `file-${i + 1}`;
                          const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
                          return (
                            <div key={i} className="detail-file">
                              {isImage ? (
                                <img src={fileUrl} alt={name} className="detail-file__thumb" />
                              ) : (
                                <div className="detail-file__icon"><FileText size={24} /></div>
                              )}
                              <span className="detail-file__name">{name}</span>
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="detail-file__download">
                                <Download size={14} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="detail-section">
                      <h4>{locale === 'ar' ? 'ملاحظات' : 'Notes'}</h4>
                      <p className="detail-notes">{selectedOrder.notes}</p>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="detail-section detail-total">
                    <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                    <strong>{selectedOrder.final_amount.toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                  </div>

                  {/* Staff notes */}
                  {!useMockData && (
                    <div className="detail-section">
                      <h4 className="detail-subtitle">
                        <StickyNote size={18} />
                        {locale === 'ar' ? 'ملاحظات الموظفين' : 'Staff notes'}
                      </h4>
                      <textarea
                        className="detail-staff-notes"
                        value={staffNotesDraft}
                        onChange={(e) => setStaffNotesDraft(e.target.value)}
                        placeholder={locale === 'ar' ? 'ملاحظات داخلية...' : 'Internal notes...'}
                        rows={3}
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSaveStaffNotes}
                        disabled={savingStaffNotes}
                      >
                        {savingStaffNotes ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : locale === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                    </div>
                  )}

                  {/* Payment */}
                  {!useMockData && (
                    <div className="detail-section">
                      <h4 className="detail-subtitle">
                        <Banknote size={18} />
                        {locale === 'ar' ? 'التسديد' : 'Payment'}
                      </h4>
                      <div className="detail-payment-row">
                        <span>{locale === 'ar' ? 'الإجمالي' : 'Total'}</span>
                        <strong>{selectedOrder.final_amount.toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                      </div>
                      <div className="detail-payment-row">
                        <span>{locale === 'ar' ? 'المدفوع' : 'Paid'}</span>
                        <strong>{(selectedOrder.paid_amount ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                      </div>
                      <div className="detail-payment-row">
                        <span>{locale === 'ar' ? 'المتبقي' : 'Remaining'}</span>
                        <strong>{(selectedOrder.remaining_amount ?? selectedOrder.final_amount ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                      </div>
                      <div className="detail-payment-actions">
                        <label className="detail-radio">
                          <input
                            type="radio"
                            name="payment-status"
                            checked={paymentIsPaid}
                            onChange={() => setPaymentIsPaid(true)}
                          />
                          {locale === 'ar' ? 'تم التسديد' : 'Paid'}
                        </label>
                        <label className="detail-radio">
                          <input
                            type="radio"
                            name="payment-status"
                            checked={!paymentIsPaid}
                            onChange={() => setPaymentIsPaid(false)}
                          />
                          {locale === 'ar' ? 'لم يتم التسديد' : 'Not paid'}
                        </label>
                      </div>
                      {!paymentIsPaid && (
                        <div className="detail-payment-input">
                          <label>{locale === 'ar' ? 'المبلغ المدفوع' : 'Amount paid'}</label>
                          <input
                            type="number"
                            min={0}
                            max={selectedOrder.final_amount ?? 0}
                            value={paymentPaidAmount}
                            onChange={(e) => setPaymentPaidAmount(Number(e.target.value) || 0)}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleSavePayment}
                        disabled={savingPayment}
                      >
                        {savingPayment ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : locale === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
