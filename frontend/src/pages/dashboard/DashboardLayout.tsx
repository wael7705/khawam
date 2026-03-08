import { useMemo, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon, BarChart3, ClipboardList, FolderOpen, Home, LogOut, Menu, Shapes, Users, Wallet, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { authAPI } from '../../lib/api';
import { clearAuth, getStoredUser } from '../../lib/auth';
import './DashboardLayout.css';

interface NavItem {
  to: string;
  label: string;
  Icon: typeof Home;
}

export function DashboardLayout() {
  const { locale, toggleLocale } = useTranslation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = getStoredUser();

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'لوحة التحكم',
            welcome: 'مرحبًا',
            home: 'الرئيسية',
            orders: 'إدارة الطلبات',
            customers: 'إدارة العملاء',
            services: 'إدارة الخدمات',
            works: 'إدارة الأعمال',
            archive: 'الأرشيف',
            finance: 'القاعدة المالية',
            langSwitch: 'English',
            analytics: 'التحليلات',
            logout: 'تسجيل الخروج',
          }
        : {
            title: 'Dashboard',
            welcome: 'Welcome',
            home: 'Home',
            orders: 'Orders',
            customers: 'Customers',
            services: 'Services',
            works: 'Works',
            archive: 'Archive',
            finance: 'Finance',
            langSwitch: 'العربية',
            analytics: 'Analytics',
            logout: 'Logout',
          },
    [locale],
  );

  const navItems: NavItem[] = [
    { to: '/dashboard', label: labels.home, Icon: Home },
    { to: '/dashboard/orders', label: labels.orders, Icon: ClipboardList },
    { to: '/dashboard/customers', label: labels.customers, Icon: Users },
    { to: '/dashboard/services', label: labels.services, Icon: Shapes },
    { to: '/dashboard/works', label: labels.works, Icon: FolderOpen },
    { to: '/dashboard/archive', label: labels.archive, Icon: ArchiveIcon },
    { to: '/dashboard/finance', label: labels.finance, Icon: Wallet },
    { to: '/dashboard/analytics', label: labels.analytics, Icon: BarChart3 },
  ];

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue clearing local session even if API logout fails.
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <img src="/images/logo.jpeg" alt="Khawam" />
          <div>
            <strong>{labels.title}</strong>
            <span>Khawam Pro</span>
          </div>
        </div>

        <nav className="dashboard-sidebar__nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} className="dashboard-sidebar__link">
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" className="dashboard-sidebar__logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>{labels.logout}</span>
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-topbar__menu"
            aria-label="Open navigation menu"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="dashboard-topbar__welcome">
            <p>{labels.welcome}</p>
            <strong>{user?.name ?? '—'}</strong>
          </div>
          <button type="button" className="dashboard-topbar__lang" onClick={toggleLocale}>
            {labels.langSwitch}
          </button>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      <div className={`dashboard-drawer ${drawerOpen ? 'dashboard-drawer--open' : ''}`}>
        <div className="dashboard-drawer__panel">
          <div className="dashboard-drawer__head">
            <strong>{labels.title}</strong>
            <button type="button" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
              <X size={18} />
            </button>
          </div>
          <nav className="dashboard-drawer__nav">
            {navItems.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className="dashboard-sidebar__link"
                onClick={() => setDrawerOpen(false)}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <button type="button" className="dashboard-sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{labels.logout}</span>
          </button>
        </div>
        <button type="button" className="dashboard-drawer__overlay" onClick={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
