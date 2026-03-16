import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { AlertCircle, Clock3, Eye, Layers3, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { dashboardApi } from '../../lib/dashboard-api';
import { adaptDashboardHomeData, type DashboardHomeDataModel } from '../../lib/dashboard-adapter';
import { useTranslation } from '../../i18n';
import './DashboardHome.css';

const STATUS_COLORS = ['#DC2626', '#F97316', '#A3A3A3'];

function getTodayDateRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    date_from: start.toISOString().slice(0, 10),
    date_to: end.toISOString().slice(0, 10),
  };
}

export function DashboardHome() {
  const { t } = useTranslation();
  const d = t.dashboard.homePage;
  const [data, setData] = useState<DashboardHomeDataModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const todayRange = getTodayDateRange();
        const [stats, performance, sales, topProducts, analyticsToday, todayVisitorsCount, todayOrders, recentOrders] =
          await Promise.all([
            dashboardApi.getStats(),
            dashboardApi.getPerformanceStats(),
            dashboardApi.getSalesOverview(30),
            dashboardApi.getTopProducts(6),
            dashboardApi.getAnalyticsStats({
              startDate: todayRange.startDate,
              endDate: todayRange.endDate,
            }),
            dashboardApi.getVisitorsCount({
              startDate: todayRange.startDate,
              endDate: todayRange.endDate,
            }),
            dashboardApi.getOrders({
              date_from: todayRange.date_from,
              date_to: todayRange.date_to,
              page: 1,
              limit: 1,
            }),
            dashboardApi.getRecentOrders(8),
          ]);

        const adapted = adaptDashboardHomeData({
          stats,
          performance,
          sales,
          topProducts,
          analyticsToday,
          todayVisitorsCount,
          todayOrders,
          recentOrders,
        });
        setData(adapted);
      } catch {
        setError(d.failed);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [d.failed]);

  if (loading) {
    return <div className="dashboard-state">{d.loading}</div>;
  }

  if (error || !data) {
    return <div className="dashboard-state dashboard-state--error">{error || d.failed}</div>;
  }

  const kpis = [
    { label: d.totalOrders, value: data.kpis.totalOrders, icon: ShoppingCart },
    { label: d.activeOrders, value: data.kpis.activeOrders, icon: Layers3 },
    { label: d.todayOrders, value: data.kpis.todayOrders, icon: TrendingUp },
    { label: d.totalRevenue, value: data.kpis.totalRevenue.toLocaleString(), icon: AlertCircle },
    { label: d.completionRate, value: `${data.kpis.completionRate}%`, icon: TrendingUp },
    { label: d.processingHours, value: data.kpis.averageProcessingHours, icon: Clock3 },
    { label: d.visitorsToday, value: data.kpis.totalVisitorsToday, icon: Users },
    { label: d.pageViewsToday, value: data.kpis.totalPageViewsToday, icon: Eye },
  ];
  const statusChartData: Array<{ name: string; value: number }> = data.statusDistribution.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  return (
    <div className="dashboard-home">
      <section className="dashboard-home__heading">
        <div>
          <h1>{d.pageTitle}</h1>
          <p>{d.pageDesc}</p>
        </div>
        <div className="dashboard-home__badge">
          <span>{d.topService}</span>
          <strong>{data.kpis.mostRequestedService}</strong>
        </div>
      </section>

      <section className="dashboard-kpis">
        {kpis.map((item) => (
          <article key={item.label} className="dashboard-kpi-card">
            <div className="dashboard-kpi-card__icon">
              <item.icon size={18} />
            </div>
            <p>{item.label}</p>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel dashboard-panel--wide">
          <h3>{d.ordersTrend}</h3>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.ordersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="ordersCount" stroke="#DC2626" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#F97316" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel">
          <h3>{d.statusDistribution}</h3>
          <div className="dashboard-chart dashboard-chart--small">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {statusChartData.map((entry, idx) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[idx % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel">
          <h3>{d.servicesPerformance}</h3>
          <div className="dashboard-chart dashboard-chart--small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.servicePerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="dashboard-panel dashboard-panel--wide">
          <h3>{d.visitorsInsights}</h3>
          <ul className="dashboard-visitors-list">
            {data.visitorsSnapshot.topPages.length === 0 ? (
              <li>{d.noData}</li>
            ) : (
              data.visitorsSnapshot.topPages.map((page) => (
                <li key={page.pagePath}>
                  <span>{page.pagePath}</span>
                  <strong>{page.views}</strong>
                </li>
              ))
            )}
          </ul>
        </article>
      </section>

      <section className="dashboard-panel">
        <h3>{d.recentOrders}</h3>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>{d.orderNo}</th>
                <th>{d.customer}</th>
                <th>{d.status}</th>
                <th>{d.amount}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.order_number}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.status}</td>
                  <td>{order.final_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
