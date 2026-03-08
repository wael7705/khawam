import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

interface TrackVisitInput {
  sessionId: string;
  userId?: string;
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  timeOnPage?: number;
  exitPage?: boolean;
  entryPage?: boolean;
  visitCount?: number;
}

interface TrackPageViewInput {
  visitorId?: string;
  sessionId: string;
  pagePath: string;
  timeSpent?: number;
  scrollDepth?: number;
  actions?: Record<string, unknown>;
}

interface GetStatsFilters {
  startDate?: Date;
  endDate?: Date;
}

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

function normalizeDateFilters(filters?: GetStatsFilters): { startDate?: Date; endDate?: Date } | undefined {
  if (!filters?.startDate && !filters?.endDate) return undefined;
  const result: { startDate?: Date; endDate?: Date } = {};
  if (filters.startDate && isValidDate(filters.startDate)) {
    result.startDate = filters.startDate;
  }
  if (filters.endDate && isValidDate(filters.endDate)) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    result.endDate = end;
  }
  if (!result.startDate && !result.endDate) return undefined;
  return result;
}

interface PageStats {
  pagePath: string;
  views: number;
  uniqueVisitors: number;
  avgTimeSpent: number;
  exitRate: number;
}

interface FunnelStep {
  pagePath: string;
  visitors: number;
  dropOff: number;
  dropOffRate: number;
}

export async function trackVisit(input: TrackVisitInput) {
  return prisma.visitorTracking.create({
    data: {
      sessionId: input.sessionId,
      userId: input.userId,
      pagePath: input.pagePath,
      referrer: input.referrer,
      userAgent: input.userAgent,
      deviceType: input.deviceType,
      browser: input.browser,
      os: input.os,
      ipAddress: input.ipAddress,
      country: input.country,
      city: input.city,
      timeOnPage: input.timeOnPage ?? 0,
      exitPage: input.exitPage ?? false,
      entryPage: input.entryPage ?? false,
      visitCount: input.visitCount ?? 1,
    },
  });
}

export async function trackPageView(input: TrackPageViewInput) {
  return prisma.pageView.create({
    data: {
      visitorId: input.visitorId,
      sessionId: input.sessionId,
      pagePath: input.pagePath,
      timeSpent: input.timeSpent ?? 0,
      scrollDepth: input.scrollDepth ?? 0,
      actions: input.actions != null ? (input.actions as Prisma.InputJsonValue) : undefined,
    },
  });
}

export async function getStats(filters?: GetStatsFilters) {
  const normalized = normalizeDateFilters(filters);
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (normalized?.startDate || normalized?.endDate) {
    where.createdAt = {};
    if (normalized.startDate) where.createdAt.gte = normalized.startDate;
    if (normalized.endDate) where.createdAt.lte = normalized.endDate;
  }

  const [visitors, pageViews, devices, browsers, topPages] = await Promise.all([
    prisma.visitorTracking.groupBy({
      by: ['sessionId'],
      where: Object.keys(where).length > 0 ? { createdAt: where.createdAt } : undefined,
      _count: { sessionId: true },
    }),
    prisma.pageView.count({
      where: Object.keys(where).length > 0 ? { createdAt: where.createdAt } : undefined,
    }),
    prisma.visitorTracking.groupBy({
      by: ['deviceType'],
      where: {
        ...(Object.keys(where).length > 0 ? { createdAt: where.createdAt } : {}),
        deviceType: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.visitorTracking.groupBy({
      by: ['browser'],
      where: {
        ...(Object.keys(where).length > 0 ? { createdAt: where.createdAt } : {}),
        browser: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.pageView.groupBy({
      by: ['pagePath'],
      where: Object.keys(where).length > 0 ? { createdAt: where.createdAt } : undefined,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  const totalVisitors = visitors.length;

  type DeviceGroup = { deviceType: string | null; _count: { id: number } };
  type BrowserGroup = { browser: string | null; _count: { id: number } };
  type PageGroup = { pagePath: string; _count: { id: number } };

  return {
    totalVisitors,
    totalPageViews: pageViews,
    devices: (devices as DeviceGroup[]).map((d) => ({
      deviceType: d.deviceType ?? 'unknown',
      count: d._count.id,
    })),
    browsers: (browsers as BrowserGroup[]).map((b) => ({
      browser: b.browser ?? 'unknown',
      count: b._count.id,
    })),
    topPages: (topPages as PageGroup[]).map((p) => ({
      pagePath: p.pagePath,
      views: p._count.id,
    })),
  };
}

export async function getExitRates(filters?: GetStatsFilters) {
  const normalized = normalizeDateFilters(filters);
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (normalized?.startDate || normalized?.endDate) {
    where.createdAt = {};
    if (normalized.startDate) where.createdAt.gte = normalized.startDate;
    if (normalized.endDate) where.createdAt.lte = normalized.endDate;
  }

  const exitPages = await prisma.visitorTracking.groupBy({
    by: ['pagePath'],
    where: {
      ...where,
      exitPage: true,
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 20,
  });

  type ExitPageGroup = { pagePath: string; _count: { id: number } };
  const totalExits = (exitPages as ExitPageGroup[]).reduce((sum: number, p: ExitPageGroup) => sum + p._count.id, 0);

  const pageViews = await prisma.pageView.groupBy({
    by: ['pagePath'],
    where: Object.keys(where).length > 0 ? { createdAt: where.createdAt } : undefined,
    _count: { id: true },
  });

  type PageViewGroup = { pagePath: string; _count: { id: number } };
  const pageViewMap = new Map((pageViews as PageViewGroup[]).map((p: PageViewGroup) => [p.pagePath, p._count.id]));

  return (exitPages as ExitPageGroup[]).map((p: ExitPageGroup) => {
    const totalViews = pageViewMap.get(p.pagePath) ?? p._count.id;
    const exitRate = totalViews > 0 ? (p._count.id / totalViews) * 100 : 0;
    return {
      pagePath: p.pagePath,
      exitCount: p._count.id,
      totalViews,
      exitRate: Math.round(exitRate * 100) / 100,
    };
  });
}

export async function getPageStats(
  pagePath: string,
  filters?: GetStatsFilters,
): Promise<PageStats | null> {
  const normalized = normalizeDateFilters(filters);
  const where: { pagePath: string; createdAt?: { gte?: Date; lte?: Date } } = {
    pagePath,
  };
  if (normalized?.startDate || normalized?.endDate) {
    where.createdAt = {};
    if (normalized.startDate) where.createdAt.gte = normalized.startDate;
    if (normalized.endDate) where.createdAt.lte = normalized.endDate;
  }

  const [views, uniqueSessions, exits] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.groupBy({
      by: ['sessionId'],
      where,
      _count: { id: true },
    }),
    prisma.visitorTracking.count({
      where: { ...where, exitPage: true },
    }),
  ]);

  const uniqueVisitors = uniqueSessions.length;
  const avgTimeSpent = await prisma.pageView.aggregate({
    where,
    _avg: { timeSpent: true },
  });
  const exitRate = views > 0 ? (exits / views) * 100 : 0;

  return {
    pagePath,
    views,
    uniqueVisitors,
    avgTimeSpent: Math.round((avgTimeSpent._avg.timeSpent ?? 0) * 100) / 100,
    exitRate: Math.round(exitRate * 100) / 100,
  };
}

export async function getVisitorCount(filters?: GetStatsFilters): Promise<number> {
  const normalized = normalizeDateFilters(filters);
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (normalized?.startDate || normalized?.endDate) {
    where.createdAt = {};
    if (normalized.startDate) where.createdAt.gte = normalized.startDate;
    if (normalized.endDate) where.createdAt.lte = normalized.endDate;
  }

  const result = await prisma.visitorTracking.groupBy({
    by: ['sessionId'],
    where: Object.keys(where).length > 0 ? where : undefined,
    _count: { sessionId: true },
  });

  return result.length;
}

export async function getFunnels(filters?: GetStatsFilters): Promise<FunnelStep[]> {
  const normalized = normalizeDateFilters(filters);
  const where: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (normalized?.startDate || normalized?.endDate) {
    where.createdAt = {};
    if (normalized.startDate) where.createdAt.gte = normalized.startDate;
    if (normalized.endDate) where.createdAt.lte = normalized.endDate;
  }

  const entryPages = await prisma.visitorTracking.findMany({
    where: {
      ...where,
      entryPage: true,
    },
    select: { pagePath: true, sessionId: true },
  });

  if (entryPages.length === 0) return [];

  type EntryPageRow = { pagePath: string; sessionId: string };
  const sessionByPage = new Map<string, Set<string>>();
  for (const p of entryPages as EntryPageRow[]) {
    const set = sessionByPage.get(p.pagePath) ?? new Set();
    set.add(p.sessionId);
    sessionByPage.set(p.pagePath, set);
  }

  const totalSessions = new Set((entryPages as EntryPageRow[]).map((p: EntryPageRow) => p.sessionId)).size;
  const sortedPages = [...sessionByPage.entries()].sort(
    (a, b) => b[1].size - a[1].size,
  );

  const steps: FunnelStep[] = [];
  let prevVisitors = totalSessions;

  for (const [pagePath, sessions] of sortedPages) {
    const visitors = sessions.size;
    const dropOff = Math.max(0, prevVisitors - visitors);
    const dropOffRate = prevVisitors > 0 ? (dropOff / prevVisitors) * 100 : 0;

    steps.push({
      pagePath,
      visitors,
      dropOff,
      dropOffRate: Math.round(dropOffRate * 100) / 100,
    });
    prevVisitors = visitors;
  }

  return steps;
}
