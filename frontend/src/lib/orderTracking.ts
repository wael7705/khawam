import {
  ClipboardList,
  BadgeCheck,
  Printer,
  CircleCheckBig,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ORDER_STATUS_FLOW, type OrderFlowStatus } from './servicesCatalog';

export const KHAWAM_WHATSAPP = '963112134640';

export interface StatusTheme {
  key: string;
  color: string;
  rgb: string;
  bg: string;
  glow: string;
  icon: LucideIcon;
}

type OrderStatusKey = 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

/** ألوان الهوية: أبيض + تدرجات الأحمر (#DC2626 / #B91C1C) */
export const ORDER_STATUS_THEMES: Record<OrderStatusKey, StatusTheme> = {
  pending: {
    key: 'pending',
    color: '#9CA3AF',
    rgb: '156, 163, 175',
    bg: '#F9FAFB',
    glow: 'rgba(156, 163, 175, 0.35)',
    icon: ClipboardList,
  },
  confirmed: {
    key: 'confirmed',
    color: '#F87171',
    rgb: '248, 113, 113',
    bg: '#FEF2F2',
    glow: 'rgba(248, 113, 113, 0.45)',
    icon: BadgeCheck,
  },
  processing: {
    key: 'processing',
    color: '#DC2626',
    rgb: '220, 38, 38',
    bg: '#FEE2E2',
    glow: 'rgba(220, 38, 38, 0.5)',
    icon: Printer,
  },
  completed: {
    key: 'completed',
    color: '#B91C1C',
    rgb: '185, 28, 28',
    bg: '#FEE2E2',
    glow: 'rgba(185, 28, 28, 0.45)',
    icon: CircleCheckBig,
  },
  cancelled: {
    key: 'cancelled',
    color: '#DC2626',
    rgb: '220, 38, 38',
    bg: '#FEF2F2',
    glow: 'rgba(220, 38, 38, 0.4)',
    icon: XCircle,
  },
};

export function getStatusTheme(status: string): StatusTheme {
  const normalized = status?.toLowerCase() ?? 'pending';
  if (normalized in ORDER_STATUS_THEMES) {
    return ORDER_STATUS_THEMES[normalized as OrderStatusKey];
  }
  return ORDER_STATUS_THEMES.pending;
}

export function getFlowIndex(status: string): number {
  const normalized = status?.toLowerCase() ?? '';
  if (normalized === 'cancelled' || normalized === 'ملغي') return -1;
  return ORDER_STATUS_FLOW.indexOf(normalized as OrderFlowStatus);
}

export function buildWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${KHAWAM_WHATSAPP}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function getProgressPercent(status: string): number {
  const idx = getFlowIndex(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / ORDER_STATUS_FLOW.length) * 100);
}
