import { z } from 'zod';

export const trackVisitSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().optional(),
  pagePath: z.string().min(1),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  ipAddress: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  timeOnPage: z.number().int().min(0).optional(),
  exitPage: z.boolean().optional(),
  entryPage: z.boolean().optional(),
  visitCount: z.number().int().min(1).optional(),
});

export const trackPageViewSchema = z.object({
  visitorId: z.string().optional(),
  sessionId: z.string().min(1),
  pagePath: z.string().min(1),
  timeSpent: z.number().int().min(0).optional(),
  scrollDepth: z.number().int().min(0).optional(),
  actions: z.record(z.unknown()).optional(),
});

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
