import { useEffect, useMemo, useState } from 'react';
import { Phone, User2, X, StickyNote, Banknote, Package } from 'lucide-react';
import { dashboardApi, type CustomerSummary, type CustomerDetail } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import { getOrderStatusLabel } from '../../lib/servicesCatalog';
import './CustomersManagement.css';

export function CustomersManagement() {
  const { locale } = useTranslation();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'بطاقات إدارة العملاء',
            subtitle: 'قسم مستقل لمتابعة العملاء الأكثر نشاطًا وقيمهم المالية.',
            orders: 'عدد الطلبات',
            spent: 'إجمالي الإنفاق',
            noCustomers: 'لا توجد بيانات عملاء حالياً',
            loading: 'تحميل بطاقات العملاء...',
            failed: 'تعذر تحميل بيانات العملاء',
            detailTitle: 'تفاصيل العميل',
            staffNotes: 'ملاحظات الموظف',
            save: 'حفظ',
            saving: 'جاري الحفظ...',
            close: 'إغلاق',
            orderList: 'الطلبات',
            totalPaid: 'إجمالي المدفوع',
            totalRemaining: 'إجمالي المتبقي',
            orderNo: 'رقم الطلب',
            status: 'الحالة',
            total: 'الإجمالي',
            paid: 'المدفوع',
            remaining: 'المتبقي',
          }
        : {
            title: 'Customer Management Cards',
            subtitle: 'Dedicated section for active customers and spending metrics.',
            orders: 'Orders',
            spent: 'Total Spent',
            noCustomers: 'No customer data available',
            loading: 'Loading customer cards...',
            failed: 'Failed to load customer data',
            detailTitle: 'Customer details',
            staffNotes: 'Staff notes',
            save: 'Save',
            saving: 'Saving...',
            close: 'Close',
            orderList: 'Orders',
            totalPaid: 'Total paid',
            totalRemaining: 'Total remaining',
            orderNo: 'Order',
            status: 'Status',
            total: 'Total',
            paid: 'Paid',
            remaining: 'Remaining',
          },
    [locale],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardApi.getCustomers();
        setCustomers(data);
      } catch {
        setError(labels.failed);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [labels.failed]);

  useEffect(() => {
    if (!selectedPhone) {
      setCustomerDetail(null);
      setDetailError('');
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    dashboardApi
      .getCustomerByPhone(selectedPhone)
      .then((data) => {
        if (!cancelled) {
          setCustomerDetail(data);
          setNotesDraft(data?.notes ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) setDetailError(labels.failed);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPhone, labels.failed]);

  useEffect(() => {
    if (customerDetail) setNotesDraft(customerDetail.notes ?? '');
  }, [customerDetail?.notes]);

  const openDetail = (phone: string) => setSelectedPhone(phone);
  const closeDetail = () => {
    setSelectedPhone(null);
    setCustomerDetail(null);
  };

  const handleSaveNotes = async () => {
    if (!selectedPhone) return;
    setSavingNotes(true);
    try {
      await dashboardApi.updateCustomerNotes(selectedPhone, notesDraft);
      setCustomerDetail((prev) => (prev ? { ...prev, notes: notesDraft } : null));
    } catch {
      setDetailError(locale === 'ar' ? 'فشل حفظ الملاحظات' : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <div className="customers-state">{labels.loading}</div>;
  }

  if (error) {
    return <div className="customers-state customers-state--error">{error}</div>;
  }

  return (
    <div className="customers-page">
      <header className="customers-page__head">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </header>

      {customers.length === 0 ? (
        <div className="customers-state">{labels.noCustomers}</div>
      ) : (
        <section className="customers-grid">
          {customers.map((customer) => (
            <article
              key={`${customer.phone ?? customer.id ?? 'unknown'}`}
              className="customer-card customer-card--clickable"
              role="button"
              tabIndex={0}
              onClick={() => customer.phone && openDetail(customer.phone)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && customer.phone) {
                  e.preventDefault();
                  openDetail(customer.phone);
                }
              }}
            >
              <div className="customer-card__top">
                <span className="customer-card__icon">
                  <User2 size={16} />
                </span>
                <div>
                  <h3>{customer.name ?? '—'}</h3>
                  <p>
                    <Phone size={13} />
                    <span>{customer.phone ?? '—'}</span>
                  </p>
                </div>
              </div>

              <div className="customer-card__stats">
                <div>
                  <span>{labels.orders}</span>
                  <strong>{customer.order_count}</strong>
                </div>
                <div>
                  <span>{labels.spent}</span>
                  <strong>{customer.total_spent.toLocaleString()}</strong>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* Customer detail drawer */}
      {selectedPhone && (
        <div className="customer-drawer-overlay" onClick={closeDetail} role="presentation" aria-hidden>
          <aside className="customer-detail-drawer" aria-label={labels.detailTitle} onClick={(e) => e.stopPropagation()}>
          <header className="customer-detail-drawer__header">
            <h2>{labels.detailTitle}</h2>
            <button type="button" className="customer-detail-drawer__close" onClick={closeDetail} aria-label={labels.close}>
              <X size={22} />
            </button>
          </header>
          <div className="customer-detail-drawer__body" onClick={(e) => e.stopPropagation()}>
            {detailError && <p className="customer-detail-drawer__error">{detailError}</p>}
            {detailLoading ? (
              <p className="customer-detail-drawer__loading">{labels.loading}</p>
            ) : customerDetail ? (
              <>
                <div className="customer-detail-drawer__info">
                  <h3>{customerDetail.name ?? '—'}</h3>
                  <p><Phone size={14} /> {customerDetail.phone ?? '—'}</p>
                </div>

                <section className="customer-detail-drawer__section">
                  <h4><StickyNote size={18} /> {labels.staffNotes}</h4>
                  <textarea
                    className="customer-detail-drawer__notes"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder={locale === 'ar' ? 'ملاحظات داخلية على العميل...' : 'Internal notes on customer...'}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveNotes} disabled={savingNotes}>
                    {savingNotes ? labels.saving : labels.save}
                  </button>
                </section>

                <section className="customer-detail-drawer__section">
                  <h4><Package size={18} /> {labels.orderList}</h4>
                  <ul className="customer-detail-drawer__orders">
                    {customerDetail.orders.map((order) => (
                      <li key={order.id} className="customer-detail-drawer__order">
                        <div className="customer-detail-drawer__order-row">
                          <span>{labels.orderNo}: {order.order_number}</span>
                          <span className="customer-detail-drawer__order-status">{getOrderStatusLabel(order.status, locale)}</span>
                        </div>
                        <div className="customer-detail-drawer__order-amounts">
                          <span>{labels.total}: {order.final_amount.toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</span>
                          <span>{labels.paid}: {(order.paid_amount ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</span>
                          <span>{labels.remaining}: {(order.remaining_amount ?? order.final_amount ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="customer-detail-drawer__section customer-detail-drawer__totals">
                  <h4><Banknote size={18} /> {locale === 'ar' ? 'التدفقات المالية' : 'Financial summary'}</h4>
                  <div className="customer-detail-drawer__total-row">
                    <span>{labels.totalPaid}</span>
                    <strong>{(customerDetail.total_paid ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                  </div>
                  <div className="customer-detail-drawer__total-row">
                    <span>{labels.totalRemaining}</span>
                    <strong>{(customerDetail.total_remaining ?? 0).toLocaleString()} {locale === 'ar' ? 'ل.س' : 'SYP'}</strong>
                  </div>
                </section>
              </>
            ) : (
              <p className="customer-detail-drawer__empty">{locale === 'ar' ? 'العميل غير موجود' : 'Customer not found'}</p>
            )}
          </div>
          </aside>
        </div>
      )}
    </div>
  );
}
