import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getAuthToken,
  setAuthToken,
  getStoredUser,
  setStoredUser,
  storeAuth,
  clearAuth,
  isAuthenticated,
  type UserData,
} from './auth';

const mockUser: UserData = {
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  phone: null,
  role: 'عميل',
};

describe('auth (storage)', () => {
  beforeEach(() => {
    clearAuth();
  });

  afterEach(() => {
    clearAuth();
  });

  it('getAuthToken returns null initially', () => {
    expect(getAuthToken()).toBeNull();
  });

  it('setAuthToken and getAuthToken round-trip', () => {
    setAuthToken('token-1');
    expect(getAuthToken()).toBe('token-1');
    setAuthToken(null);
    expect(getAuthToken()).toBeNull();
  });

  it('getStoredUser returns null initially', () => {
    expect(getStoredUser()).toBeNull();
  });

  it('setStoredUser and getStoredUser round-trip', () => {
    setStoredUser(mockUser);
    expect(getStoredUser()).toEqual(mockUser);
    setStoredUser(null);
    expect(getStoredUser()).toBeNull();
  });

  it('storeAuth sets both token and user', () => {
    storeAuth('my-token', mockUser);
    expect(getAuthToken()).toBe('my-token');
    expect(getStoredUser()).toEqual(mockUser);
  });

  it('clearAuth clears token and user', () => {
    storeAuth('t', mockUser);
    clearAuth();
    expect(getAuthToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('isAuthenticated is true only when token is set', () => {
    expect(isAuthenticated()).toBe(false);
    setAuthToken('x');
    expect(isAuthenticated()).toBe(true);
    setAuthToken(null);
    expect(isAuthenticated()).toBe(false);
  });

  it('token is not written to localStorage', () => {
    localStorage.removeItem('khawam_token');
    storeAuth('secret-token', mockUser);
    expect(localStorage.getItem('khawam_token')).toBeNull();
  });
});
