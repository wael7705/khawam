import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FolderArchive, Package, TrendingUp } from 'lucide-react';
import { dashboardApi, type ManagedWork } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './Archive.css';

interface ArchivedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  final_amount: number;
  created_at: string;
}

function toYmd(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function Archive() {
  const { locale } = useTranslation();
  const [mode, setMode] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [orders, setOrders] = useState<ArchivedOrder[]>([]);
  const [archivedWorks, setArchivedWorks] = useState<ManagedWork[]>([]);
  const [loading, setLoading] = useState(true);

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'الأرشيف',
            subtitle: 'متابعة الطلبات المؤرشفة والأعمال المخفية.',
            daily: 'يومي',
            monthly: 'شهري',
            archivedOrders: 'الطلبات المؤرشفة',
            archivedWorks: 'الأعمال المخفية',
            noOrders: 'لا توجد طلبات في الأرشيف للفترة المحددة',
            noWorks: 'لا توجد أعمال مخفية',
            loading: 'تحميل بيانات الأرشيف...',
          }
        : {
            title: 'Archive',
            subtitle: 'Track archived orders and hidden works.',
            daily: 'Daily',
            monthly: 'Monthly',
            archivedOrders: 'Archived Orders',
            archivedWorks: 'Hidden Works',
            noOrders: 'No archived orders for selected period',
            noWorks: 'No hidden works',
            loading: 'Loading archive...',
          },
    [locale],
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [ordersRes, worksRes] = await Promise.all([
        dashboardApi.getOrders({ status: 'completed', limit: 500 }).catch(() => ({ data: [] } as { data: ArchivedOrder[] })),
        dashboardApi.getManagedWorks().catch(() => [] as ManagedWork[]),
      ]);
      const rows = Array.isArray(ordersRes.data) ? (ordersRes.data as ArchivedOrder[]) : [];
      const filtered = rows.filter((order) => {
        const d = new Date(order.created_at);
        if (mode === 'daily') return toYmd(order.created_at) === date;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      });
      setOrders(filtered);
      setArchivedWorks(worksRes.filter((work) => !work.is_visible));
      setLoading(false);
    };
    void load();
  }, [date, mode, month, year]);

  const totalRevenue = orders.reduce((sum, order) => sum + (order.final_amount || 0), 0);

  if (loading) return <div className="archive-state">{labels.loading}</div>;

  return (
    <div className="archive-page">
      <header className="archive-header">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
      </header>

      <section className="archive-filters">
        <div className="archive-mode">
          <button type="button" className={mode === 'daily' ? 'active' : ''} onClick={() => setMode('daily')}>
            {labels.daily}
          </button>
          <button type="button" className={mode === 'monthly' ? 'active' : ''} onClick={() => setMode('monthly')}>
            {labels.monthly}
          </button>
        </div>
        {mode === 'daily' ? (
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        ) : (
          <div className="archive-monthly">
            <input type="number" value={year} min={2020} onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())} />
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      <section className="archive-stats">
        <article>
          <Package size={18} />
          <span>{orders.length}</span>
        </article>
        <article>
          <TrendingUp size={18} />
          <span>{totalRevenue.toLocaleString()}</span>
        </article>
        <article>
          <FolderArchive size={18} />
          <span>{archivedWorks.length}</span>
        </article>
      </section>

      <section className="archive-card">
        <h3>
          <CalendarDays size={16} />
          {labels.archivedOrders}
        </h3>
        {orders.length === 0 ? (
          <p className="archive-empty">{labels.noOrders}</p>
        ) : (
          <table className="archive-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{locale === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{locale === 'ar' ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.status}</td>
                  <td>{order.final_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="archive-card">
        <h3>{labels.archivedWorks}</h3>
        {archivedWorks.length === 0 ? (
          <p className="archive-empty">{labels.noWorks}</p>
        ) : (
          <div className="archive-works">
            {archivedWorks.map((work) => (
              <article key={work.id}>
                <strong>{locale === 'ar' ? work.title_ar : work.title}</strong>
                <span>{locale === 'ar' ? (work.category_ar ?? '-') : (work.category ?? work.category_ar ?? '-')}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
