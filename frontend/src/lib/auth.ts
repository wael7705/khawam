export interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

// تخزين في الذاكرة فقط — لا يُكتب التوكن أو بيانات المستخدم في localStorage
let inMemoryToken: string | null = null;
let inMemoryUser: UserData | null = null;

const DEV_USER: UserData = {
  id: 'local-dev-admin',
  name: 'Local Admin',
  email: 'local@khawam.dev',
  phone: null,
  role: 'مدير',
};

/** مغلق لأسباب أمنية — لا دخول سريع بدون سيرفر */
export function isDevAuthBypassEnabled(): boolean {
  return false;
}

export function getAuthToken(): string | null {
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
}

export function setStoredUser(user: UserData | null): void {
  inMemoryUser = user;
}

export function getStoredUser(): UserData | null {
  return inMemoryUser;
}

export function storeAuth(token: string, user: UserData): void {
  setAuthToken(token);
  setStoredUser(user);
}

export function clearAuth(): void {
  setAuthToken(null);
  setStoredUser(null);
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function createDevSession(user: UserData = DEV_USER): UserData {
  setAuthToken('local-dev-token');
  setStoredUser(user);
  return user;
}
