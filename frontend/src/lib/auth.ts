export interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

const DEV_USER: UserData = {
  id: 'local-dev-admin',
  name: 'Local Admin',
  email: 'local@khawam.dev',
  phone: null,
  role: 'مدير',
};

export function isDevAuthBypassEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS !== 'false';
}

export function getStoredUser(): UserData | null {
  try {
    const raw = localStorage.getItem('khawam_user');
    if (!raw) return null;
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

export function storeAuth(token: string, user: UserData): void {
  localStorage.setItem('khawam_token', token);
  localStorage.setItem('khawam_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('khawam_token');
  localStorage.removeItem('khawam_user');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('khawam_token');
}

export function createDevSession(user: UserData = DEV_USER): UserData {
  storeAuth('local-dev-token', user);
  return user;
}
