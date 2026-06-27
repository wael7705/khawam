import { Clock, CheckCircle2, Cog, PackageCheck, XCircle, type LucideIcon } from 'lucide-react';
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

export const ORDER_STATUS_THEMES: Record<OrderStatusKey, StatusTheme> = {
  pending: {
    key: 'pending',
    color: '#F59E0B',
    rgb: '245, 158, 11',
    bg: 'rgba(245, 158, 11, 0.14)',
    glow: 'rgba(245, 158, 11, 0.5)',
    icon: Clock,
  },
  confirmed: {
    key: 'confirmed',
    color: '#3B82F6',
    rgb: '59, 130, 246',
    bg: 'rgba(59, 130, 246, 0.14)',
    glow: 'rgba(59, 130, 246, 0.5)',
    icon: CheckCircle2,
  },
  processing: {
    key: 'processing',
    color: '#8B5CF6',
    rgb: '139, 92, 246',
    bg: 'rgba(139, 92, 246, 0.14)',
    glow: 'rgba(139, 92, 246, 0.5)',
    icon: Cog,
  },
  completed: {
    key: 'completed',
    color: '#10B981',
    rgb: '16, 185, 129',
    bg: 'rgba(16, 185, 129, 0.14)',
    glow: 'rgba(16, 185, 129, 0.5)',
    icon: PackageCheck,
  },
  cancelled: {
    key: 'cancelled',
    color: '#EF4444',
    rgb: '239, 68, 68',
    bg: 'rgba(239, 68, 68, 0.14)',
    glow: 'rgba(239, 68, 68, 0.5)',
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
