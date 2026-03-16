import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  Line,
  LineChart,
} from 'recharts';
import { dashboardApi, type AnalyticsStatsResponse, type ExitRateRow, type FunnelRow } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './Analytics.css';

type DatePreset = 7 | 30 | 90;

interface AnalyticsViewData {
  stats: AnalyticsStatsResponse;
  exitRates: ExitRateRow[];
  funnels: FunnelRow[];
}

const CHART_COLORS = ['#DC2626', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#1E1E1E'];

function getDateRange(days: DatePreset): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  };
}

export function Analytics() {
  const { t, locale } = useTranslation();
  const d = t.dashboard.analyticsPage;
  const [preset, setPreset] = useState<DatePreset>(30);
  const [data, setData] = useState<AnalyticsViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const range = getDateRange(preset);
        const [stats, exitRates, funnels] = await Promise.all([
          dashboardApi.getAnalyticsStats(range),
          dashboardApi.getExitRates(range),
          dashboardApi.getFunnels(range),
        ]);
        setData({ stats, exitRates, funnels });
      } catch {
        setError(d.failed);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [d.failed, preset]);

  if (loading) {
    return <div className="analytics-state">{d.loading}</div>;
  }

  if (error || !data) {
    return <div className="analytics-state analytics-state--error">{error || d.failed}</div>;
  }

  return (
    <div className="analytics-page">
      <header className="analytics-head">
        <div>
          <h1>{d.title}</h1>
          <p>{d.subtitle}</p>
        </div>
        <div className="analytics-periods">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              className={preset === days ? 'analytics-period analytics-period--active' : 'analytics-period'}
              onClick={() => setPreset(days as DatePreset)}
            >
              {locale === 'ar' ? `${days} ${d.days}` : `${days} ${d.days}`}
            </button>
          ))}
        </div>
      </header>

      <section className="analytics-kpis">
        <article>
          <span>{d.totalVisitors}</span>
          <strong>{data.stats.totalVisitors.toLocaleString()}</strong>
        </article>
        <article>
          <span>{d.totalViews}</span>
          <strong>{data.stats.totalPageViews.toLocaleString()}</strong>
        </article>
      </section>

      <section className="analytics-grid">
        <article className="analytics-panel">
          <h3>{d.devices}</h3>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.stats.devices} dataKey="count" nameKey="deviceType" cx="50%" cy="50%" outerRadius={90}>
                  {data.stats.devices.map((entry, idx) => (
                    <Cell key={entry.deviceType} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <h3>{d.browsers}</h3>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.stats.browsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="browser" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#DC2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel analytics-panel--wide">
          <h3>{d.exitRate}</h3>
          <div className="analytics-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.exitRates.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="pagePath" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="exitRate" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel analytics-panel--wide">
          <h3>{d.funnel}</h3>
          {data.funnels.length === 0 ? (
            <div className="analytics-empty">{d.noData}</div>
          ) : (
            <div className="analytics-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.funnels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="pagePath" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="visitors" stroke="#DC2626" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="analytics-panel analytics-panel--wide">
          <h3>{d.topPages}</h3>
          <ul className="analytics-list">
            {data.stats.topPages.map((page) => (
              <li key={page.pagePath}>
                <span>{page.pagePath}</span>
                <strong>{page.views}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
