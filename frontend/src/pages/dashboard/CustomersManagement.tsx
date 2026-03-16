import { useEffect, useState } from 'react';
import { Phone, User2, X, StickyNote, Banknote, Package } from 'lucide-react';
import { dashboardApi, type CustomerSummary, type CustomerDetail } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import { getOrderStatusLabel } from '../../lib/servicesCatalog';
import './CustomersManagement.css';

export function CustomersManagement() {
  const { t, locale } = useTranslation();
  const d = t.dashboard.customersPage;
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await dashboardApi.getCustomers();
        setCustomers(data);
      } catch {
        setError(d.failed);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [d.failed]);

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
        if (!cancelled) setDetailError(d.failed);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedPhone, d.failed]);

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
      setDetailError(d.saveNotesFailed);
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <div className="customers-state">{d.loading}</div>;
  }

  if (error) {
    return <div className="customers-state customers-state--error">{error}</div>;
  }

  return (
    <div className="customers-page">
      <header className="customers-page__head">
        <h1>{d.title}</h1>
        <p>{d.subtitle}</p>
      </header>

      {customers.length === 0 ? (
        <div className="customers-state">{d.noCustomers}</div>
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
                  <span>{d.orders}</span>
                  <strong>{customer.order_count}</strong>
                </div>
                <div>
                  <span>{d.spent}</span>
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
          <aside className="customer-detail-drawer" aria-label={d.detailTitle} onClick={(e) => e.stopPropagation()}>
          <header className="customer-detail-drawer__header">
            <h2>{d.detailTitle}</h2>
            <button type="button" className="customer-detail-drawer__close" onClick={closeDetail} aria-label={d.close}>
              <X size={22} />
            </button>
          </header>
          <div className="customer-detail-drawer__body" onClick={(e) => e.stopPropagation()}>
            {detailError && <p className="customer-detail-drawer__error">{detailError}</p>}
            {detailLoading ? (
              <p className="customer-detail-drawer__loading">{d.loading}</p>
            ) : customerDetail ? (
              <>
                <div className="customer-detail-drawer__info">
                  <h3>{customerDetail.name ?? '—'}</h3>
                  <p><Phone size={14} /> {customerDetail.phone ?? '—'}</p>
                </div>

                <section className="customer-detail-drawer__section">
                  <h4><StickyNote size={18} /> {d.staffNotes}</h4>
                  <textarea
                    className="customer-detail-drawer__notes"
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    placeholder={d.notesPlaceholder}
                  />
                  <button type="button" className="btn btn-primary btn-sm" onClick={handleSaveNotes} disabled={savingNotes}>
                    {savingNotes ? d.saving : d.save}
                  </button>
                </section>

                <section className="customer-detail-drawer__section">
                  <h4><Package size={18} /> {d.orderList}</h4>
                  <ul className="customer-detail-drawer__orders">
                    {customerDetail.orders.map((order) => (
                      <li key={order.id} className="customer-detail-drawer__order">
                        <div className="customer-detail-drawer__order-row">
                          <span>{d.orderNo}: {order.order_number}</span>
                          <span className="customer-detail-drawer__order-status">{getOrderStatusLabel(order.status, locale)}</span>
                        </div>
                        <div className="customer-detail-drawer__order-amounts">
                          <span>{d.total}: {order.final_amount.toLocaleString()} {d.syb}</span>
                          <span>{d.paid}: {(order.paid_amount ?? 0).toLocaleString()} {d.syb}</span>
                          <span>{d.remaining}: {(order.remaining_amount ?? order.final_amount ?? 0).toLocaleString()} {d.syb}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="customer-detail-drawer__section customer-detail-drawer__totals">
                  <h4><Banknote size={18} /> {d.financialSummary}</h4>
                  <div className="customer-detail-drawer__total-row">
                    <span>{d.totalPaid}</span>
                    <strong>{(customerDetail.total_paid ?? 0).toLocaleString()} {d.syb}</strong>
                  </div>
                  <div className="customer-detail-drawer__total-row">
                    <span>{d.totalRemaining}</span>
                    <strong>{(customerDetail.total_remaining ?? 0).toLocaleString()} {d.syb}</strong>
                  </div>
                </section>
              </>
            ) : (
              <p className="customer-detail-drawer__empty">{d.notFound}</p>
            )}
          </div>
          </aside>
        </div>
      )}
    </div>
  );
}
