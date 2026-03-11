import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersAPI } from '../lib/api';
import { useTranslation } from '../i18n';
import { isAuthenticated } from '../lib/auth';
import type { ReorderData } from '../types/order';
import '../pages/MyOrders.css';

/** بيانات إعادة الطلب كما يرجعها الـ API (تحتوي order_id و order_number أيضاً) */
interface ReorderApiData extends ReorderData {
  order_id?: string;
  order_number?: string;
  items: Array<{
    product_id?: string;
    product_name?: string;
    quantity: number;
    unit_price?: number;
    size_id?: string;
    material_id?: string;
    specifications?: Record<string, unknown>;
    design_files?: string[];
    production_notes?: string;
  }>;
}

function buildCreatePayload(data: ReorderApiData): Record<string, unknown> {
  return {
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    customer_whatsapp: data.customer_whatsapp,
    shop_name: data.shop_name,
    items: data.items.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      size_id: item.size_id,
      material_id: item.material_id,
      specifications: item.specifications,
      design_files: item.design_files,
      production_notes: item.production_notes,
    })),
    total_amount: data.total_amount ?? data.final_amount ?? 0,
    final_amount: data.final_amount ?? data.total_amount ?? 0,
    delivery_type: data.delivery_type,
    delivery_address: data.delivery_address,
    delivery_street: data.delivery_street,
    delivery_neighborhood: data.delivery_neighborhood,
    delivery_building_floor: data.delivery_building_floor,
    delivery_extra: data.delivery_extra,
    delivery_latitude: data.delivery_latitude,
    delivery_longitude: data.delivery_longitude,
    notes: data.notes,
    files: data.files,
  };
}

export function ReorderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { locale, t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<ReorderApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { replace: true });
      return;
    }
    if (!orderId) {
      navigate('/my-orders', { replace: true });
      return;
    }
  }, [navigate, orderId]);

  useEffect(() => {
    if (!orderId || !isAuthenticated()) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    ordersAPI
      .getReorderData(orderId)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data as unknown as ReorderApiData;
        if (!raw || !Array.isArray(raw.items) || raw.items.length === 0) {
          setError(locale === 'ar' ? 'لا توجد بيانات لإعادة الطلب' : 'No reorder data available');
          setData(null);
          return;
        }
        setData(raw);
      })
      .catch(() => {
        if (!cancelled) {
          setError(locale === 'ar' ? 'تعذر تحميل بيانات الطلب' : 'Failed to load order data');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, locale]);

  const handleSubmit = useCallback(async () => {
    if (!data) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = buildCreatePayload(data);
      const result = await ordersAPI.create(payload) as { data?: { id: string; order_number: string } };
      navigate('/my-orders', { replace: true });
    } catch {
      setError(locale === 'ar' ? 'فشل إنشاء الطلب' : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  }, [data, locale, navigate]);

  const myOrders = (t as { myOrders?: { reorder: string; title: string; total: string; loading: string; empty?: string } }).myOrders;
  const reorderLabel = myOrders?.reorder ?? (locale === 'ar' ? 'إعادة الطلب' : 'Reorder');
  const totalLabel = myOrders?.total ?? (locale === 'ar' ? 'الإجمالي' : 'Total');
  const loadingLabel = myOrders?.loading ?? (locale === 'ar' ? 'جاري التحميل...' : 'Loading...');

  if (!isAuthenticated()) return null;

  if (loading) {
    return (
      <div className="my-orders-page">
        <section className="my-orders section">
          <div className="container">
            <p className="my-orders__state">{loadingLabel}</p>
          </div>
        </section>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="my-orders-page">
        <section className="my-orders section">
          <div className="container">
            <p className="my-orders__state my-orders__state--error">{error}</p>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/my-orders')}>
              {locale === 'ar' ? 'العودة لطلباتي' : 'Back to My Orders'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!data) return null;

  const total = data.final_amount ?? data.total_amount ?? 0;

  return (
    <div className="my-orders-page">
      <section className="my-orders section">
        <div className="container">
          <h1 className="my-orders__title">
            {reorderLabel} #{data.order_number ?? orderId}
          </h1>
          <p className="my-orders__state">
            {locale === 'ar'
              ? 'مراجعة العناصر وتأكيد إنشاء طلب جديد بنفس البيانات.'
              : 'Review items and confirm to create a new order with the same data.'}
          </p>
          <div className="my-orders__list" style={{ maxWidth: 560 }}>
            {data.items.map((item, i) => (
              <article key={i} className="my-orders__card">
                <div className="my-orders__card-main">
                  <span className="my-orders__card-service">
                    {item.product_name ?? (locale === 'ar' ? 'عنصر' : 'Item')} {i + 1}
                  </span>
                  <span className="my-orders__card-id">× {item.quantity}</span>
                  {item.unit_price != null && (
                    <span className="my-orders__card-date">
                      {Number(item.unit_price * item.quantity).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="my-orders-drawer__total" style={{ marginTop: 16, marginBottom: 16 }}>
            <span>{totalLabel}</span>
            <strong>{Number(total).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
          </div>
          {error && <p className="my-orders__state my-orders__state--error">{error}</p>}
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? (locale === 'ar' ? 'جاري الإنشاء...' : 'Creating...')
              : (locale === 'ar' ? 'تأكيد وإنشاء الطلب' : 'Confirm and create order')}
          </button>
          <button
            type="button"
            className="btn"
            style={{ marginInlineStart: 12 }}
            onClick={() => navigate('/my-orders')}
          >
            {locale === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </section>
    </div>
  );
}
