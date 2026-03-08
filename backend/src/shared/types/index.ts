export const ROLES = {
  ADMIN: 'مدير',
  EMPLOYEE: 'موظف',
  CUSTOMER: 'عميل',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const STAFF_ROLES: readonly UserRole[] = [ROLES.ADMIN, ROLES.EMPLOYEE];

export function isStaffRole(role: string | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.EMPLOYEE;
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface JwtPayload {
  sub: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'partial'
  | 'paid'
  | 'refunded';

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
