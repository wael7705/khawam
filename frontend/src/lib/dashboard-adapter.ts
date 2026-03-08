import type {
  AdminOrdersResponse,
  AnalyticsStatsResponse,
  DashboardStatsResponse,
  PerformanceStatsResponse,
  RecentOrderItem,
  SalesOverviewResponse,
  TopProductItem,
} from './dashboard-api';

export interface DashboardKpiModel {
  totalOrders: number;
  activeOrders: number;
  todayOrders: number;
  totalRevenue: number;
  completionRate: number;
  averageProcessingHours: number;
  totalVisitorsToday: number;
  totalPageViewsToday: number;
  mostRequestedService: string;
}

export interface OrdersTrendModel {
  label: string;
  ordersCount: number;
  revenue: number;
}

export interface ServicePerformanceModel {
  name: string;
  orders: number;
  quantity: number;
}

export interface VisitorsSnapshotModel {
  totalVisitors: number;
  totalPageViews: number;
  topPages: Array<{ pagePath: string; views: number }>;
  devices: Array<{ name: string; value: number }>;
  browsers: Array<{ name: string; value: number }>;
}

export interface StatusDistributionModel {
  name: string;
  value: number;
}

export interface DashboardHomeDataModel {
  kpis: DashboardKpiModel;
  ordersTrend: OrdersTrendModel[];
  servicePerformance: ServicePerformanceModel[];
  visitorsSnapshot: VisitorsSnapshotModel;
  statusDistribution: StatusDistributionModel[];
  recentOrders: RecentOrderItem[];
}

const formatShortDate = (isoDate: string): string =>
  new Date(isoDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

export function adaptDashboardHomeData(input: {
  stats: DashboardStatsResponse;
  performance: PerformanceStatsResponse;
  sales: SalesOverviewResponse;
  topProducts: TopProductItem[];
  analyticsToday: AnalyticsStatsResponse;
  todayVisitorsCount: number;
  todayOrders: AdminOrdersResponse;
  recentOrders: RecentOrderItem[];
}): DashboardHomeDataModel {
  const mostRequested = input.topProducts[0]?.product_name ?? '—';

  const ordersTrend: OrdersTrendModel[] = input.sales.daily.map((point) => ({
    label: formatShortDate(point.date),
    ordersCount: point.count,
    revenue: point.total,
  }));

  const servicePerformance: ServicePerformanceModel[] = input.topProducts.map((item) => ({
    name: item.product_name,
    orders: item.order_count,
    quantity: item.total_quantity,
  }));

  const statusDistribution: StatusDistributionModel[] = [
    { name: 'مكتمل', value: input.stats.completed_orders },
    { name: 'نشط', value: input.stats.pending_orders },
    {
      name: 'أخرى',
      value: Math.max(0, input.stats.total_orders - input.stats.completed_orders - input.stats.pending_orders),
    },
  ];

  const visitorsSnapshot: VisitorsSnapshotModel = {
    totalVisitors: input.analyticsToday.totalVisitors,
    totalPageViews: input.analyticsToday.totalPageViews,
    topPages: input.analyticsToday.topPages.slice(0, 5),
    devices: input.analyticsToday.devices.map((d) => ({ name: d.deviceType, value: d.count })),
    browsers: input.analyticsToday.browsers.map((b) => ({ name: b.browser, value: b.count })),
  };

  return {
    kpis: {
      totalOrders: input.stats.total_orders,
      activeOrders: input.stats.pending_orders,
      todayOrders: input.todayOrders.total,
      totalRevenue: input.stats.total_revenue,
      completionRate: input.performance.completion_rate,
      averageProcessingHours: input.performance.average_processing_time_hours,
      totalVisitorsToday: input.todayVisitorsCount,
      totalPageViewsToday: input.analyticsToday.totalPageViews,
      mostRequestedService: mostRequested,
    },
    ordersTrend,
    servicePerformance,
    visitorsSnapshot,
    statusDistribution,
    recentOrders: input.recentOrders,
  };
}
