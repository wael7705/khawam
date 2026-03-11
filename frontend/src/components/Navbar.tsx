import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Facebook } from 'lucide-react';
import { useTranslation } from '../i18n/index';
import { getStoredUser, clearAuth } from '../lib/auth';
import './Navbar.css';

const navItems = [
  { key: 'home', href: '#home' },
  { key: 'about', href: '#about' },
  { key: 'services', href: '#services' },
  { key: 'works', href: '#works' },
  { key: 'contact', href: '#contact' },
] as const;

export function Navbar() {
  const { t, locale, toggleLocale } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setDropdownOpen(false);
    navigate('/');
  };

  const langLabel = locale === 'ar' ? 'English' : 'العربية';

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__top">
        <div className="navbar__top-inner container">
          <button
            type="button"
            className="navbar__lang"
            onClick={toggleLocale}
            aria-label={langLabel}
          >
            {langLabel}
          </button>
          <div className="navbar__social">
            <a href="#" aria-label="Facebook">
              <Facebook size={18} />
            </a>
          </div>
        </div>
      </div>
      <div className="navbar__main">
        <div className="navbar__main-inner container">
          <Link to="/" className="navbar__logo">
            <img src="/images/logo.jpeg" alt="Khawam" height={50} />
          </Link>
          <nav className="navbar__nav">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="navbar__link"
              >
                {t.nav[item.key]}
              </a>
            ))}
            {user?.role === 'مدير' && (
              <Link to="/dashboard" className="navbar__link navbar__link--staff">
                {t.nav.dashboard}
              </Link>
            )}
            {user?.role === 'موظف' && (
              <Link to="/dashboard/orders" className="navbar__link navbar__link--staff">
                {t.nav.ordersManagement}
              </Link>
            )}
          </nav>
          <div className="navbar__actions">
            {user ? (
              <div className="navbar__user-wrap">
                <button
                  type="button"
                  className="navbar__user-btn"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                >
                  <span className="navbar__user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </button>
                {dropdownOpen && (
                  <>
                    <div
                      className="navbar__dropdown-backdrop"
                      onClick={() => setDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="navbar__dropdown">
                      <div className="navbar__dropdown-header">
                        {t.nav.welcome} {user.name}
                      </div>
                      <Link
                        to="/my-orders"
                        className="navbar__dropdown-link"
                        onClick={() => setDropdownOpen(false)}
                      >
                        {t.nav.myOrders}
                      </Link>
                      <Link
                        to="/settings"
                        className="navbar__dropdown-link"
                        onClick={() => setDropdownOpen(false)}
                      >
                        {t.nav.settings}
                      </Link>
                      <button
                        type="button"
                        className="navbar__dropdown-btn"
                        onClick={handleLogout}
                      >
                        {t.nav.logout}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline navbar__btn-login">
                  {t.nav.login}
                </Link>
                <Link to="/order" className="btn btn-primary navbar__btn-order">
                  {t.nav.order}
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="navbar__hamburger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      <div className={`navbar__drawer ${mobileOpen ? 'navbar__drawer--open' : ''}`}>
        <div className="navbar__drawer-backdrop" onClick={() => setMobileOpen(false)} />
        <div className="navbar__drawer-panel">
          <nav className="navbar__drawer-nav">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="navbar__drawer-link"
                onClick={() => setMobileOpen(false)}
              >
                {t.nav[item.key]}
              </a>
            ))}
            {user?.role === 'مدير' && (
              <Link
                to="/dashboard"
                className="navbar__drawer-link navbar__drawer-link--staff"
                onClick={() => setMobileOpen(false)}
              >
                {t.nav.dashboard}
              </Link>
            )}
            {user?.role === 'موظف' && (
              <Link
                to="/dashboard/orders"
                className="navbar__drawer-link navbar__drawer-link--staff"
                onClick={() => setMobileOpen(false)}
              >
                {t.nav.ordersManagement}
              </Link>
            )}
          </nav>
          <div className="navbar__drawer-actions">
            {user ? (
              <>
                <div className="navbar__drawer-user">
                  {t.nav.welcome} {user.name}
                </div>
                <Link
                  to="/my-orders"
                  className="navbar__drawer-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.myOrders}
                </Link>
                <Link
                  to="/settings"
                  className="navbar__drawer-link"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.settings}
                </Link>
                <button
                  type="button"
                  className="navbar__drawer-logout"
                  onClick={() => {
                    handleLogout();
                    setMobileOpen(false);
                  }}
                >
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline navbar__drawer-btn"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.login}
                </Link>
                <Link
                  to="/order"
                  className="btn btn-primary navbar__drawer-btn"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.order}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
