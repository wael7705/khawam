import { useMemo, useState, useEffect, useCallback } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Archive as ArchiveIcon, BarChart3, ChevronLeft, ChevronRight, ClipboardList, FolderOpen, Globe, Home, LogOut, Menu, Moon, Sun, Users, Wallet, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { authAPI } from '../../lib/api';
import { clearAuth, getStoredUser } from '../../lib/auth';
import { useOrderCreated, type OrderCreatedPayload } from '../../lib/socket';
import './DashboardLayout.css';

function playNewOrderSound(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore if AudioContext not supported or autoplay blocked
  }
}

const DASHBOARD_THEME_KEY = 'khawam_dashboard_theme';

interface NavItem {
  to: string;
  label: string;
  Icon: typeof Home;
}

export function DashboardLayout() {
  const { t, locale, toggleLocale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOrderNotification, setNewOrderNotification] = useState<OrderCreatedPayload | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem(DASHBOARD_THEME_KEY);
      return v === 'dark';
    } catch {
      return false;
    }
  });
  const user = getStoredUser();

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_THEME_KEY, isDarkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDarkMode]);

  useEffect(() => {
    const className = 'dashboard-dark-mode';
    if (isDarkMode) {
      document.body.classList.add(className);
      document.documentElement.classList.add(className);
    } else {
      document.body.classList.remove(className);
      document.documentElement.classList.remove(className);
    }
    return () => {
      document.body.classList.remove(className);
      document.documentElement.classList.remove(className);
    };
  }, [isDarkMode]);

  const d = t.dashboard;

  const navItems: NavItem[] = useMemo(() => {
    const all: NavItem[] = [
      { to: '/dashboard', label: d.home, Icon: Home },
      { to: '/dashboard/orders', label: d.orders, Icon: ClipboardList },
      { to: '/dashboard/customers', label: d.customers, Icon: Users },
      { to: '/dashboard/works', label: d.works, Icon: FolderOpen },
      { to: '/dashboard/archive', label: d.archive, Icon: ArchiveIcon },
      { to: '/dashboard/finance', label: d.finance, Icon: Wallet },
      { to: '/dashboard/analytics', label: d.analytics, Icon: BarChart3 },
    ];
    if (user?.role === 'موظف') {
      return [{ to: '/dashboard/orders', label: d.orders, Icon: ClipboardList }];
    }
    return all;
  }, [user?.role, d]);

  useOrderCreated(
    useCallback((payload: OrderCreatedPayload) => {
      setNewOrderNotification(payload);
      playNewOrderSound();
    }, []),
  );

  const dismissNewOrderNotification = useCallback(() => {
    setNewOrderNotification(null);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Continue clearing local session even if API logout fails.
    }
    clearAuth();
    navigate('/login');
  };

  const employeeAllowedPaths = ['/dashboard/orders'];
  if (user?.role === 'موظف' && !employeeAllowedPaths.includes(location.pathname)) {
    return <Navigate to="/dashboard/orders" replace />;
  }

  return (
    <div
      className={`dashboard-layout ${isCollapsed ? 'dashboard-layout--sidebar-collapsed' : ''} ${isDarkMode ? 'dashboard-layout--dark' : ''}`}
    >
      {newOrderNotification && (
        <div className="dashboard-order-toast" role="alert">
          <div className="dashboard-order-toast__inner">
            <span className="dashboard-order-toast__title">
              {d.newOrder}
            </span>
            <span className="dashboard-order-toast__number">
              #{newOrderNotification.order_number}
            </span>
            <Link
              to="/dashboard/orders"
              className="dashboard-order-toast__link"
              onClick={dismissNewOrderNotification}
            >
              {d.viewOrders}
            </Link>
            <button
              type="button"
              className="dashboard-order-toast__close"
              onClick={dismissNewOrderNotification}
              aria-label={d.close}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <aside className={`dashboard-sidebar ${isCollapsed ? 'dashboard-sidebar--collapsed' : ''}`}>
        <div className="dashboard-sidebar__brand">
          <img src="/images/logo.jpeg" alt="Khawam" />
          <div className="dashboard-sidebar__brand-text">
            <strong>{d.title}</strong>
            <span>Khawam Pro</span>
          </div>
          <button
            type="button"
            className="dashboard-sidebar__collapse-btn"
            aria-label={isCollapsed ? d.expandSidebar : d.collapseSidebar}
            onClick={() => setIsCollapsed((c) => !c)}
          >
            {locale === 'ar' ? (
              isCollapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
            ) : (
              isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
            )}
          </button>
        </div>

        <nav className="dashboard-sidebar__nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} end={to === '/dashboard'} className="dashboard-sidebar__link" title={label}>
              <Icon size={18} />
              <span className="dashboard-sidebar__link-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dashboard-sidebar__helper">
          <Link to="/" className="dashboard-sidebar__link dashboard-sidebar__helper-link" title={d.backToSite}>
            <Home size={18} />
            <span className="dashboard-sidebar__link-label">{d.backToSite}</span>
          </Link>
          <button
            type="button"
            className="dashboard-sidebar__link dashboard-sidebar__helper-link"
            onClick={() => setIsDarkMode((x) => !x)}
            title={isDarkMode ? d.lightMode : d.darkMode}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="dashboard-sidebar__link-label">
              {isDarkMode ? d.light : d.dark}
            </span>
          </button>
          <button
            type="button"
            className="dashboard-sidebar__link dashboard-sidebar__helper-link"
            onClick={toggleLocale}
            title={d.langSwitch}
          >
            <Globe size={18} />
            <span className="dashboard-sidebar__link-label">{d.langSwitch}</span>
          </button>
        </div>

        <button type="button" className="dashboard-sidebar__logout" onClick={handleLogout} title={d.logout}>
          <LogOut size={18} />
          <span className="dashboard-sidebar__link-label">{d.logout}</span>
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
            <p>{d.welcome}</p>
            <strong>{user?.name ?? '—'}</strong>
          </div>
        </header>

        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>

      <div className={`dashboard-drawer ${drawerOpen ? 'dashboard-drawer--open' : ''}`}>
        <div className="dashboard-drawer__panel">
          <div className="dashboard-drawer__head">
            <strong>{d.title}</strong>
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
          <div className="dashboard-drawer__helper">
            <Link
              to="/"
              className="dashboard-sidebar__link dashboard-sidebar__helper-link"
              onClick={() => setDrawerOpen(false)}
            >
              <Home size={18} />
              <span>{d.backToSite}</span>
            </Link>
            <button
              type="button"
              className="dashboard-sidebar__link dashboard-sidebar__helper-link"
              onClick={() => { setIsDarkMode((x) => !x); setDrawerOpen(false); }}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDarkMode ? d.light : d.dark}</span>
            </button>
            <button
              type="button"
              className="dashboard-sidebar__link dashboard-sidebar__helper-link"
              onClick={() => { toggleLocale(); setDrawerOpen(false); }}
            >
              <Globe size={18} />
              <span>{d.langSwitch}</span>
            </button>
          </div>
          <button type="button" className="dashboard-sidebar__logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>{d.logout}</span>
          </button>
        </div>
        <button type="button" className="dashboard-drawer__overlay" onClick={() => setDrawerOpen(false)} />
      </div>
    </div>
  );
}
