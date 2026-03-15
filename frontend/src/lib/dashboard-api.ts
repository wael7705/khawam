import { api } from './api';

export interface DashboardStatsResponse {
  total_orders: number;
  completed_orders: number;
  pending_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
}

export interface PerformanceStatsResponse {
  average_processing_time_hours: number;
  completion_rate: number;
  total_orders: number;
  completed_orders: number;
}

export interface TopProductItem {
  product_id: string;
  product_name: string;
  total_quantity: number;
  order_count: number;
}

export interface TopServiceItem {
  id: string;
  name_ar: string;
  name_en: string;
  base_price: number;
  display_order: number;
}

export interface SalesPoint {
  date: string;
  total: number;
  count: number;
}

export interface SalesOverviewResponse {
  daily: SalesPoint[];
  weekly: Array<{ week: string; total: number; count: number }>;
  monthly: Array<{ month: string; total: number; count: number }>;
}

export interface RecentOrderItem {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  final_amount: number;
  created_at: string;
  items: Array<{ product_name: string; quantity: number }>;
}

export interface AdminOrdersResponse {
  data: Array<{
    id: string;
    order_number: string;
    service_id?: string;
    service_name_ar?: string;
    service_name_en?: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    final_amount: number;
    is_paid: boolean;
    created_at: string;
    items: Array<{ id: string; product_name: string; quantity: number; total_price: number }>;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AnalyticsStatsResponse {
  totalVisitors: number;
  totalPageViews: number;
  devices: Array<{ deviceType: string; count: number }>;
  browsers: Array<{ browser: string; count: number }>;
  topPages: Array<{ pagePath: string; views: number }>;
}

export interface ExitRateRow {
  pagePath: string;
  exitCount: number;
  totalViews: number;
  exitRate: number;
}

export interface FunnelRow {
  pagePath: string;
  visitors: number;
  dropOff: number;
  dropOffRate: number;
}

export interface CustomerSummary {
  id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  order_count: number;
  total_spent: number;
}

export interface CustomerOrderItem {
  id: string;
  order_number: string;
  status: string;
  final_amount: number;
  paid_amount?: number;
  remaining_amount?: number;
  is_paid?: boolean;
  created_at: string;
  items: Array<{ product_name: string; quantity: number; total_price: number }>;
}

export interface CustomerDetail {
  id: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  order_count: number;
  total_spent: number;
  total_paid?: number;
  total_remaining?: number;
  orders: CustomerOrderItem[];
}

export interface PricingRuleSummary {
  id: string;
  nameAr: string;
  nameEn?: string | null;
  calculationType: 'piece' | 'area' | 'page';
  basePrice: number;
  isActive: boolean;
}

export type PrintMode = 'bw' | 'color_normal' | 'color_laser';
export type SizeCode = 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'BOOKLET_A5' | 'BOOKLET_B5' | 'BOOKLET_A4';

export interface FinancialRange {
  id?: string;
  min_value: number;
  max_value?: number | null;
  unit_price: number;
  display_order?: number;
}

export interface FinancialDimension {
  id?: string;
  print_mode: PrintMode;
  size_code: SizeCode;
  display_order?: number;
  ranges: FinancialRange[];
}

export interface FinancialRule {
  id: string;
  service_id: string;
  name: string;
  name_en?: string | null;
  unit_type: string;
  priority: number;
  is_active: boolean;
  dimensions: FinancialDimension[];
  service?: { id: string; nameAr: string; nameEn?: string | null };
}

export interface FinancialRulePayload {
  service_id: string;
  name: string;
  name_en?: string;
  unit_type: string;
  priority?: number;
  is_active?: boolean;
  dimensions: FinancialDimension[];
}

export interface ServicePricingCoverage {
  service_id: string;
  service_name_ar: string;
  service_name_en: string | null;
  has_pricing: boolean;
  matched_rules_count: number;
  matched_rules: Array<{ id: string; name_ar: string; calculation_type: string }>;
}

export interface ManagedService {
  id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  is_active: boolean;
  is_visible: boolean;
  display_order: number;
  features?: Record<string, unknown> | null;
}

export interface ManagedServiceUpdatePayload {
  is_active?: boolean;
  is_visible?: boolean;
  display_order?: number;
  features?: Record<string, unknown>;
}

export interface ManagedWork {
  id: string;
  title: string;
  title_ar: string;
  description: string | null;
  description_ar: string | null;
  image_url: string;
  images: string[];
  category: string | null;
  category_ar: string | null;
  is_featured: boolean;
  is_visible: boolean;
  display_order: number;
}

export interface ManagedWorkPayload {
  title: string;
  title_ar: string;
  description?: string;
  description_ar?: string;
  image_url: string;
  images?: string[];
  category?: string;
  category_ar?: string;
  is_featured?: boolean;
  is_visible?: boolean;
  display_order?: number;
}

export interface PublicWork {
  id: string;
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  image_url: string;
  images: string[];
  category: string;
  category_ar: string;
  is_featured: boolean;
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface OrdersQuery {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

type AdminOrderRow = AdminOrdersResponse['data'][number];

const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'completed'] as const;
type FlowStatus = (typeof ORDER_FLOW)[number];

const nowIso = new Date().toISOString();
let mockOrders: AdminOrderRow[] = [
  {
    id: 'mock-order-1',
    order_number: 'KH-24001',
    service_id: 'svc-brochure',
    customer_name: 'أحمد الخطيب',
    customer_phone: '0999123456',
    status: 'pending',
    final_amount: 175000,
    is_paid: false,
    created_at: nowIso,
    items: [
      { id: 'itm-1', product_name: 'طباعة بروشور', quantity: 2, total_price: 80000 },
      { id: 'itm-2', product_name: 'بطاقات أعمال', quantity: 1, total_price: 95000 },
    ],
  },
  {
    id: 'mock-order-2',
    order_number: 'KH-24002',
    service_id: 'svc-clothing',
    customer_name: 'سارة الحسن',
    customer_phone: '0933456789',
    status: 'processing',
    final_amount: 240000,
    is_paid: true,
    created_at: nowIso,
    items: [{ id: 'itm-3', product_name: 'طباعة تيشيرتات', quantity: 3, total_price: 240000 }],
  },
];

function toYmd(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function matchesDateRange(orderDate: string, dateFrom?: string, dateTo?: string): boolean {
  const orderYmd = toYmd(orderDate);
  if (dateFrom && orderYmd < dateFrom) return false;
  if (dateTo && orderYmd > dateTo) return false;
  return true;
}

function isActiveStatus(status: string): boolean {
  return ['pending', 'confirmed', 'processing'].includes(status.toLowerCase());
}

function buildMockOrdersResponse(query: OrdersQuery): AdminOrdersResponse {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, query.limit ?? 20);
  const q = (query.search ?? '').trim().toLowerCase();

  const filtered = mockOrders.filter((o) => {
    if (query.status && o.status !== query.status) return false;
    if (!matchesDateRange(o.created_at, query.date_from, query.date_to)) return false;
    if (!q) return true;
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.toLowerCase().includes(q)
    );
  });

  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

function buildMockStats(): DashboardStatsResponse {
  const totalOrders = mockOrders.length;
  const completedOrders = mockOrders.filter((o) => o.status === 'completed').length;
  const pendingOrders = mockOrders.filter((o) => isActiveStatus(o.status)).length;
  const totalRevenue = mockOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.final_amount, 0);
  return {
    total_orders: totalOrders,
    completed_orders: completedOrders,
    pending_orders: pendingOrders,
    total_revenue: totalRevenue,
    total_customers: mockOrders.length,
    total_products: 6,
  };
}

function buildMockTopProducts(limit = 6): TopProductItem[] {
  const map = new Map<string, TopProductItem>();
  for (const order of mockOrders) {
    for (const item of order.items) {
      const existing = map.get(item.product_name);
      if (existing) {
        existing.total_quantity += item.quantity;
        existing.order_count += 1;
      } else {
        map.set(item.product_name, {
          product_id: `prd-${map.size + 1}`,
          product_name: item.product_name,
          total_quantity: item.quantity,
          order_count: 1,
        });
      }
    }
  }
  return [...map.values()].slice(0, limit);
}

function buildMockSalesOverview(days = 30): SalesOverviewResponse {
  const dailyMap = new Map<string, { total: number; count: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyMap.set(key, { total: 0, count: 0 });
  }
  for (const order of mockOrders) {
    const key = toYmd(order.created_at);
    if (!dailyMap.has(key)) continue;
    const row = dailyMap.get(key);
    if (!row) continue;
    row.total += order.final_amount;
    row.count += 1;
    dailyMap.set(key, row);
  }
  return {
    daily: [...dailyMap.entries()].map(([date, value]) => ({ date, total: value.total, count: value.count })),
    weekly: [{ week: `${new Date().getFullYear()}-W${String(10).padStart(2, '0')}`, total: 415000, count: 2 }],
    monthly: [{ month: new Date().toISOString().slice(0, 7), total: 415000, count: 2 }],
  };
}

function buildMockRecentOrders(limit = 8): RecentOrderItem[] {
  return mockOrders.slice(0, limit).map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    status: o.status,
    final_amount: o.final_amount,
    created_at: o.created_at,
    items: o.items.map((i) => ({ product_name: i.product_name, quantity: i.quantity })),
  }));
}

function buildMockAnalyticsStats(): AnalyticsStatsResponse {
  return {
    totalVisitors: 142,
    totalPageViews: 438,
    devices: [
      { deviceType: 'mobile', count: 88 },
      { deviceType: 'desktop', count: 44 },
      { deviceType: 'tablet', count: 10 },
    ],
    browsers: [
      { browser: 'Chrome', count: 96 },
      { browser: 'Safari', count: 27 },
      { browser: 'Edge', count: 12 },
      { browser: 'Firefox', count: 7 },
    ],
    topPages: [
      { pagePath: '/', views: 180 },
      { pagePath: '/services/printing', views: 112 },
      { pagePath: '/works', views: 83 },
      { pagePath: '/order', views: 63 },
    ],
  };
}

function buildMockCustomers(): CustomerSummary[] {
  return [
    {
      id: 'mock-customer-1',
      name: 'أحمد الخطيب',
      phone: '0999123456',
      email: null,
      notes: 'عميل دائم',
      order_count: 4,
      total_spent: 515000,
    },
    {
      id: 'mock-customer-2',
      name: 'سارة الحسن',
      phone: '0933456789',
      email: null,
      notes: null,
      order_count: 2,
      total_spent: 240000,
    },
  ];
}

function buildMockPricingRules(): PricingRuleSummary[] {
  return [
    {
      id: 'mock-rule-lecture-pages-1',
      nameAr: 'طباعة صفحات - حتى 10 صفحات',
      calculationType: 'page',
      basePrice: 1500,
      isActive: true,
    },
    {
      id: 'mock-rule-lecture-pages-2',
      nameAr: 'طباعة صفحات - من 11 إلى 100 صفحة',
      calculationType: 'page',
      basePrice: 1200,
      isActive: true,
    },
  ];
}

function buildMockPricingCoverage(): ServicePricingCoverage[] {
  return [
    {
      service_id: 'svc-printing',
      service_name_ar: 'خدمات الطباعة',
      service_name_en: 'Printing Service',
      has_pricing: true,
      matched_rules_count: 2,
      matched_rules: [
        {
          id: 'mock-rule-lecture-pages-1',
          name_ar: 'طباعة صفحات - حتى 10 صفحات',
          calculation_type: 'page',
        },
      ],
    },
    {
      service_id: 'svc-rollup',
      service_name_ar: 'رول أب',
      service_name_en: 'Roll Up',
      has_pricing: false,
      matched_rules_count: 0,
      matched_rules: [],
    },
    {
      service_id: 'svc-design',
      service_name_ar: 'تصميم',
      service_name_en: 'Design',
      has_pricing: false,
      matched_rules_count: 0,
      matched_rules: [],
    },
  ];
}

let mockFinancialRules: FinancialRule[] = [
  {
    id: 'mock-fin-rule-printing',
    service_id: 'svc-printing',
    name: 'قاعدة طباعة افتراضية',
    unit_type: 'page',
    priority: 0,
    is_active: true,
    dimensions: [
      {
        id: 'dim-bw-a4',
        print_mode: 'bw',
        size_code: 'A4',
        ranges: [
          { id: 'r1', min_value: 0, max_value: 10, unit_price: 1800, display_order: 1 },
          { id: 'r2', min_value: 11, max_value: 100, unit_price: 1500, display_order: 2 },
          { id: 'r3', min_value: 101, max_value: null, unit_price: 1200, display_order: 3 },
        ],
      },
      {
        id: 'dim-color-a4',
        print_mode: 'color_normal',
        size_code: 'A4',
        ranges: [
          { id: 'r4', min_value: 0, max_value: 10, unit_price: 2800, display_order: 1 },
          { id: 'r5', min_value: 11, max_value: 100, unit_price: 2400, display_order: 2 },
        ],
      },
      {
        id: 'dim-laser-a4',
        print_mode: 'color_laser',
        size_code: 'A4',
        ranges: [
          { id: 'r6', min_value: 0, max_value: 10, unit_price: 3500, display_order: 1 },
          { id: 'r7', min_value: 11, max_value: null, unit_price: 3200, display_order: 2 },
        ],
      },
    ],
  },
];

const LEGACY_MOCK_SERVICES: ManagedService[] = [
  {
    id: 'svc-lecture-printing',
    name_ar: 'طباعة محاضرات',
    name_en: 'Lecture Printing',
    description_ar: 'طباعة محاضرات الطلاب مع خيارات تجليد متعددة.',
    is_active: true,
    is_visible: true,
    display_order: 1,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'lecture',
      subgroup_label_ar: 'محاضرات',
      subgroup_label_en: 'Lectures',
    },
  },
  {
    id: 'svc-clothing-printing',
    name_ar: 'الطباعة على الملابس',
    name_en: 'Clothing Printing',
    description_ar: 'طباعة الشعارات والتصاميم على الملابس.',
    is_active: true,
    is_visible: true,
    display_order: 2,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'clothing',
      subgroup_label_ar: 'ملابس',
      subgroup_label_en: 'Clothing',
    },
  },
  {
    id: 'svc-flex-printing',
    name_ar: 'طباعة فليكس',
    name_en: 'Flex Printing',
    description_ar: 'طباعة فليكس بأحجام كبيرة.',
    is_active: true,
    is_visible: true,
    display_order: 3,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'flex',
      subgroup_label_ar: 'فليكس',
      subgroup_label_en: 'Flex',
    },
  },
  {
    id: 'svc-vinyl-printing',
    name_ar: 'طباعة فينيل',
    name_en: 'Vinyl Printing',
    description_ar: 'طباعة فينيل لاصق بجميع الأنواع.',
    is_active: true,
    is_visible: true,
    display_order: 4,
    features: {
      group_key: 'branding',
      group_label_ar: 'خدمات الهوية والإعلان',
      subgroup_key: 'vinyl',
      subgroup_label_ar: 'فينيل',
      subgroup_label_en: 'Vinyl',
    },
  },
  {
    id: 'svc-brochures',
    name_ar: 'طباعة بروشورات',
    name_en: 'Brochure Printing',
    description_ar: 'طباعة بروشورات ورقية احترافية.',
    is_active: true,
    is_visible: true,
    display_order: 5,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'brochures',
      subgroup_label_ar: 'بروشورات',
      subgroup_label_en: 'Brochures',
    },
  },
  {
    id: 'svc-business-cards',
    name_ar: 'الكروت الشخصية',
    name_en: 'Business Cards',
    description_ar: 'طباعة كروت شخصية بتشطيبات متعددة.',
    is_active: true,
    is_visible: true,
    display_order: 6,
    features: {
      group_key: 'cards',
      group_label_ar: 'خدمات البطاقات',
      subgroup_key: 'business-cards',
      subgroup_label_ar: 'كروت شخصية',
      subgroup_label_en: 'Business Cards',
    },
  },
  {
    id: 'svc-poster-printing',
    name_ar: 'طباعة كلك بولستر',
    name_en: 'Glossy Poster Printing',
    description_ar: 'طباعة كلك بولستر عالية الجودة.',
    is_active: true,
    is_visible: true,
    display_order: 7,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'posters',
      subgroup_label_ar: 'بوسترات',
      subgroup_label_en: 'Posters',
    },
  },
  {
    id: 'svc-rollup',
    name_ar: 'البانرات الإعلانية (Roll up)',
    name_en: 'Advertising Banners (Roll up)',
    description_ar: 'بانرات رول أب للمعارض والفعاليات.',
    is_active: true,
    is_visible: true,
    display_order: 8,
    features: {
      group_key: 'branding',
      group_label_ar: 'خدمات الهوية والإعلان',
      subgroup_key: 'rollup',
      subgroup_label_ar: 'رول أب',
      subgroup_label_en: 'Roll Up',
    },
  },
  {
    id: 'svc-engineering',
    name_ar: 'طباعة مشاريع هندسية',
    name_en: 'Engineering Printing',
    description_ar: 'طباعة المخططات والمشاريع الهندسية.',
    is_active: true,
    is_visible: true,
    display_order: 9,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'engineering',
      subgroup_label_ar: 'مشاريع هندسية',
      subgroup_label_en: 'Engineering',
    },
  },
  {
    id: 'svc-books-printing',
    name_ar: 'طباعة كتب',
    name_en: 'Books Printing',
    description_ar: 'طباعة الكتب بعدة مقاسات وورق.',
    is_active: true,
    is_visible: true,
    display_order: 10,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'books',
      subgroup_label_ar: 'كتب',
      subgroup_label_en: 'Books',
    },
  },
  {
    id: 'svc-thesis-printing',
    name_ar: 'طباعة رسائل (ماجستير/دكتوراه)',
    name_en: 'Thesis Printing',
    description_ar: 'طباعة وتجليد الرسائل الأكاديمية.',
    is_active: true,
    is_visible: true,
    display_order: 11,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'thesis',
      subgroup_label_ar: 'رسائل',
      subgroup_label_en: 'Thesis',
    },
  },
  {
    id: 'svc-quran-certificate',
    name_ar: 'طباعة إجازة حفظ القرآن الكريم',
    name_en: 'Quran Certificate Printing',
    description_ar: 'طباعة إجازات حفظ القرآن الكريم.',
    is_active: true,
    is_visible: true,
    display_order: 12,
    features: {
      group_key: 'printing',
      group_label_ar: 'خدمات الطباعة',
      subgroup_key: 'certificate',
      subgroup_label_ar: 'إجازات',
      subgroup_label_en: 'Certificates',
    },
  },
  {
    id: 'svc-graphic-design',
    name_ar: 'التصميم الجرافيكي',
    name_en: 'Graphic Design',
    description_ar: 'تصميم شعارات وهوية بصرية.',
    is_active: true,
    is_visible: true,
    display_order: 13,
    features: { group_key: 'design', group_label_ar: 'خدمات التصميم', subgroup_key: 'graphic' },
  },
];
let mockServices: ManagedService[] = [...LEGACY_MOCK_SERVICES];
let mockWorks: ManagedWork[] = [
  {
    id: 'wrk-1',
    title: 'Brand Identity',
    title_ar: 'هوية بصرية',
    description: 'Visual identity package',
    description_ar: 'مشروع هوية بصرية متكامل',
    image_url: '/images/hero-mockup.jpg',
    images: ['/images/hero-mockup.jpg'],
    category: 'branding',
    category_ar: 'هوية بصرية',
    is_featured: true,
    is_visible: true,
    display_order: 1,
  },
];

async function tryOrMock<T>(request: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (canUseDashboardMockData()) {
      return fallback();
    }
    throw error;
  }
}

/** تفعيل صريح فقط: عند VITE_DASHBOARD_MOCK=true نعرض بيانات وهمية؛ وإلا مصدر البيانات هو الـ API (البيانات المدخلة حصراً). */
export function canUseDashboardMockData(): boolean {
  return import.meta.env.VITE_DASHBOARD_MOCK === 'true';
}

export function advanceMockOrderStatus(orderId: string): AdminOrderRow | null {
  const index = mockOrders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;
  const current = mockOrders[index];
  if (!current) return null;
  const currentIndex = ORDER_FLOW.findIndex((s) => s === (current.status as FlowStatus));
  if (currentIndex < 0) return current;
  if (currentIndex === ORDER_FLOW.length - 1) return current;
  const nextStatus = ORDER_FLOW[currentIndex + 1];
  if (!nextStatus) return current;
  const updated: AdminOrderRow = { ...current, status: nextStatus };
  mockOrders = mockOrders.map((o) => (o.id === orderId ? updated : o));
  return updated;
}

export function setMockOrderCancelled(orderId: string): AdminOrderRow | null {
  const index = mockOrders.findIndex((o) => o.id === orderId);
  if (index < 0) return null;
  const current = mockOrders[index];
  if (!current) return null;
  const updated: AdminOrderRow = { ...current, status: 'cancelled' };
  mockOrders = mockOrders.map((o) => (o.id === orderId ? updated : o));
  return updated;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStatsResponse> => {
    return tryOrMock(
      async () => {
        const { data } = await api.get<DashboardStatsResponse>('/admin/dashboard/stats');
        return data;
      },
      () => buildMockStats(),
    );
  },
  getPerformanceStats: async (): Promise<PerformanceStatsResponse> => {
    return tryOrMock(
      async () => {
        const { data } = await api.get<PerformanceStatsResponse>('/admin/dashboard/performance-stats');
        return data;
      },
      () => ({
        average_processing_time_hours: 7.5,
        completion_rate: 42,
        total_orders: mockOrders.length,
        completed_orders: mockOrders.filter((o) => o.status === 'completed').length,
      }),
    );
  },
  getTopProducts: async (limit = 6): Promise<TopProductItem[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ products: TopProductItem[] }>('/admin/dashboard/top-products', {
        params: { limit },
      });
      return data.products;
    }, () => buildMockTopProducts(limit));
  },
  getTopServices: async (limit = 6): Promise<TopServiceItem[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ services: TopServiceItem[] }>('/admin/dashboard/top-services', {
        params: { limit },
      });
      return data.services;
    }, () => buildMockTopProducts(limit).map((item, idx) => ({
      id: item.product_id,
      name_ar: item.product_name,
      name_en: item.product_name,
      base_price: 0,
      display_order: idx + 1,
    })));
  },
  getSalesOverview: async (days = 30): Promise<SalesOverviewResponse> => {
    return tryOrMock(async () => {
      const { data } = await api.get<SalesOverviewResponse>('/admin/dashboard/sales-overview', {
        params: { days },
      });
      return data;
    }, () => buildMockSalesOverview(days));
  },
  getRecentOrders: async (limit = 8): Promise<RecentOrderItem[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ orders: RecentOrderItem[] }>('/admin/dashboard/recent-orders', {
        params: { limit },
      });
      return data.orders;
    }, () => buildMockRecentOrders(limit));
  },
  getOrders: async (query: OrdersQuery): Promise<AdminOrdersResponse> => {
    return tryOrMock(async () => {
      const { data } = await api.get<AdminOrdersResponse>('/admin/orders/all', { params: query });
      return data;
    }, () => buildMockOrdersResponse(query));
  },
  getOrderById: async (orderId: string): Promise<Record<string, unknown>> => {
    const { data } = await api.get<Record<string, unknown>>(`/admin/orders/${orderId}`);
    return data;
  },
  updateOrderStatus: async (orderId: string, status: string, notes?: string): Promise<void> => {
    await api.put(`/admin/orders/${orderId}/status`, { status, notes });
  },
  updateOrderStaffNotes: async (orderId: string, staff_notes: string): Promise<void> => {
    await api.put(`/admin/orders/${orderId}/staff-notes`, { staff_notes });
  },
  updateOrderPaid: async (orderId: string, payload: { is_paid: boolean; paid_amount?: number }): Promise<void> => {
    await api.put(`/admin/orders/${orderId}/paid`, payload);
  },
  getAnalyticsStats: async (query?: DateRangeQuery): Promise<AnalyticsStatsResponse> => {
    return tryOrMock(async () => {
      const { data } = await api.get<AnalyticsStatsResponse>('/analytics/stats', { params: query });
      return data;
    }, () => buildMockAnalyticsStats());
  },
  getVisitorsCount: async (query?: DateRangeQuery): Promise<number> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ count: number }>('/analytics/visitors', { params: query });
      return data.count;
    }, () => buildMockAnalyticsStats().totalVisitors);
  },
  getExitRates: async (query?: DateRangeQuery): Promise<ExitRateRow[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<ExitRateRow[]>('/analytics/exit-rates', { params: query });
      return data;
    }, () => [
      { pagePath: '/', exitCount: 21, totalViews: 180, exitRate: 11.67 },
      { pagePath: '/services/printing', exitCount: 14, totalViews: 112, exitRate: 12.5 },
      { pagePath: '/works', exitCount: 10, totalViews: 83, exitRate: 12.05 },
    ]);
  },
  getFunnels: async (query?: DateRangeQuery): Promise<FunnelRow[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<FunnelRow[]>('/analytics/funnels', { params: query });
      return data;
    }, () => [
      { pagePath: '/', visitors: 142, dropOff: 0, dropOffRate: 0 },
      { pagePath: '/services/printing', visitors: 86, dropOff: 56, dropOffRate: 39.44 },
      { pagePath: '/order', visitors: 42, dropOff: 44, dropOffRate: 51.16 },
    ]);
  },
  getCustomers: async (): Promise<CustomerSummary[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ customers: CustomerSummary[] }>('/admin/customers');
      return data.customers;
    }, () => buildMockCustomers());
  },
  getCustomerByPhone: async (phone: string): Promise<CustomerDetail | null> => {
    const { data } = await api.get<CustomerDetail | null>(`/admin/customers/${encodeURIComponent(phone)}`);
    return data;
  },
  updateCustomerNotes: async (phone: string, notes: string): Promise<void> => {
    await api.put(`/admin/customers/${encodeURIComponent(phone)}/notes`, { notes });
  },
  getPricingRules: async (): Promise<PricingRuleSummary[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ rules: PricingRuleSummary[] }>('/pricing-rules');
      return data.rules;
    }, () => buildMockPricingRules());
  },
  getServicePricingCoverage: async (): Promise<ServicePricingCoverage[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ services: ServicePricingCoverage[] }>('/pricing/services-coverage');
      return data.services;
    }, () => buildMockPricingCoverage());
  },
  getFinancialRules: async (): Promise<FinancialRule[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ rules: FinancialRule[] }>('/pricing/financial-rules');
      return data.rules;
    }, () => mockFinancialRules);
  },
  getManagedServices: async (): Promise<ManagedService[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ services: ManagedService[] }>('/admin/services/all');
      return data.services;
    }, () => mockServices);
  },
  updateManagedService: async (serviceId: string, payload: ManagedServiceUpdatePayload): Promise<{ success: boolean }> => {
    return tryOrMock(async () => {
      await api.put(`/admin/services/${serviceId}`, payload);
      return { success: true };
    }, () => {
      mockServices = mockServices.map((item) => (item.id === serviceId ? { ...item, ...payload } : item));
      return { success: true };
    });
  },
  deleteManagedService: async (serviceId: string): Promise<{ success: boolean }> => {
    return tryOrMock(async () => {
      await api.delete(`/admin/services/${serviceId}`);
      return { success: true };
    }, () => {
      mockServices = mockServices.filter((item) => item.id !== serviceId);
      return { success: true };
    });
  },
  importLegacyServicesSeed: async (): Promise<{ success: boolean; created: number; workflows: number }> => {
    return tryOrMock(async () => {
      const { data } = await api.post<{ success: boolean; created: number; workflows: number }>('/admin/services/import-legacy');
      return data;
    }, () => {
      const existingIds = new Set(mockServices.map((item) => item.id));
      let created = 0;
      for (const seed of LEGACY_MOCK_SERVICES) {
        if (existingIds.has(seed.id)) continue;
        mockServices.push(seed);
        created += 1;
      }
      mockServices = mockServices
        .sort((a, b) => a.display_order - b.display_order)
        .map((item, index) => ({ ...item, display_order: index + 1 }));
      return { success: true, created, workflows: 39 };
    });
  },
  getManagedWorks: async (): Promise<ManagedWork[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ works: ManagedWork[] }>('/admin/works/all');
      return data.works;
    }, () => mockWorks);
  },
  getPublicWorks: async (): Promise<PublicWork[]> => {
    return tryOrMock(async () => {
      const { data } = await api.get<{ works: PublicWork[] }>('/portfolio/linked');
      return data.works;
    }, () =>
      mockWorks
        .filter((work) => work.is_visible)
        .map((work) => ({
          id: work.id,
          title: work.title,
          title_ar: work.title_ar,
          description: work.description ?? '',
          description_ar: work.description_ar ?? '',
          image_url: work.image_url,
          images: work.images,
          category: work.category ?? '',
          category_ar: work.category_ar ?? '',
          is_featured: work.is_featured,
        })),
    );
  },
  createManagedWork: async (payload: ManagedWorkPayload): Promise<{ id: string }> => {
    return tryOrMock(async () => {
      const { data } = await api.post<{ id: string }>('/admin/works', payload);
      return data;
    }, () => {
      const id = `wrk-${Date.now()}`;
      mockWorks = [
        {
          id,
          title: payload.title,
          title_ar: payload.title_ar,
          description: payload.description ?? null,
          description_ar: payload.description_ar ?? null,
          image_url: payload.image_url,
          images: payload.images ?? [],
          category: payload.category ?? null,
          category_ar: payload.category_ar ?? null,
          is_featured: payload.is_featured ?? false,
          is_visible: payload.is_visible ?? true,
          display_order: payload.display_order ?? mockWorks.length + 1,
        },
        ...mockWorks,
      ];
      return { id };
    });
  },
  updateManagedWork: async (workId: string, payload: Partial<ManagedWorkPayload>): Promise<{ success: boolean }> => {
    return tryOrMock(async () => {
      await api.put(`/admin/works/${workId}`, payload);
      return { success: true };
    }, () => {
      mockWorks = mockWorks.map((work) => (work.id === workId ? { ...work, ...payload } as ManagedWork : work));
      return { success: true };
    });
  },
  deleteManagedWork: async (workId: string): Promise<{ success: boolean }> => {
    return tryOrMock(async () => {
      await api.delete(`/admin/works/${workId}`);
      return { success: true };
    }, () => {
      mockWorks = mockWorks.filter((work) => work.id !== workId);
      return { success: true };
    });
  },
  importLegacyWorksOnce: async (): Promise<{ success: boolean; created: number; skipped: number }> => {
    return tryOrMock(async () => {
      const { data } = await api.post<{ success: boolean; created: number; skipped: number }>('/admin/works/import-legacy-once');
      return data;
    }, () => ({ success: true, created: 0, skipped: mockWorks.length }));
  },
  uploadAdminFile: async (file: File, subdir: 'products' | 'general' = 'general'): Promise<{ url: string }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<{ url: string; filename: string }>(`/admin/upload?subdir=${subdir}`, form);
    return { url: data.url };
  },
  uploadAdminMultiple: async (files: File[], subdir: 'products' | 'general' = 'general'): Promise<{ urls: string[] }> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const { data } = await api.post<{ urls: string[]; filenames: string[] }>(`/admin/upload/multiple?subdir=${subdir}`, form);
    return { urls: data.urls };
  },
  createFinancialRule: async (payload: FinancialRulePayload): Promise<FinancialRule> => {
    return tryOrMock(async () => {
      const { data } = await api.post<{ rule: FinancialRule }>('/pricing/financial-rules', payload);
      return data.rule;
    }, () => {
      const newRule: FinancialRule = {
        id: `mock-fin-${Date.now()}`,
        service_id: payload.service_id,
        name: payload.name,
        name_en: payload.name_en ?? null,
        unit_type: payload.unit_type,
        priority: payload.priority ?? 0,
        is_active: payload.is_active ?? true,
        dimensions: payload.dimensions,
      };
      mockFinancialRules = [newRule, ...mockFinancialRules];
      return newRule;
    });
  },
  updateFinancialRule: async (ruleId: string, payload: Partial<FinancialRulePayload>): Promise<FinancialRule> => {
    return tryOrMock(async () => {
      const { data } = await api.put<{ rule: FinancialRule }>(`/pricing/financial-rules/${ruleId}`, payload);
      return data.rule;
    }, () => {
      const current = mockFinancialRules.find((rule) => rule.id === ruleId);
      if (!current) throw new Error('Financial rule not found');
      const updated: FinancialRule = {
        ...current,
        ...payload,
        dimensions: payload.dimensions ?? current.dimensions,
      };
      mockFinancialRules = mockFinancialRules.map((rule) => (rule.id === ruleId ? updated : rule));
      return updated;
    });
  },
  importLegacyFinancialTemplate: async (): Promise<{ success: boolean; imported: number; message: string }> => {
    return tryOrMock(async () => {
      const { data } = await api.post<{ success: boolean; imported: number; message: string }>(
        '/pricing/financial-rules/import-legacy-template',
      );
      return data;
    }, () => ({ success: true, imported: 0, message: 'Mock template already available' }));
  },
};
