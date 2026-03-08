import { useEffect, useMemo, useState } from 'react';
import { Phone, User2 } from 'lucide-react';
import { dashboardApi, type CustomerSummary } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './CustomersManagement.css';

export function CustomersManagement() {
  const { locale } = useTranslation();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          }
        : {
            title: 'Customer Management Cards',
            subtitle: 'Dedicated section for active customers and spending metrics.',
            orders: 'Orders',
            spent: 'Total Spent',
            noCustomers: 'No customer data available',
            loading: 'Loading customer cards...',
            failed: 'Failed to load customer data',
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
            <article key={`${customer.phone ?? customer.id ?? 'unknown'}`} className="customer-card">
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
    </div>
  );
}
