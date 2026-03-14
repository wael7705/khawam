import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom';
import type { ReactElement } from 'react';
import { I18nProvider } from './i18n/index';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';
import { ServicesCatalog } from './pages/ServicesCatalog';
import { Portfolio } from './pages/Portfolio';
import { MyOrders } from './pages/MyOrders';
import { ReorderPage } from './pages/ReorderPage';

const DeliveryLocationPage = lazy(() => import('./pages/DeliveryLocationPage').then((m) => ({ default: m.DeliveryLocationPage })));

function ServicesCatalogWithOrder() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  return <ServicesCatalog initialOrderSlug={serviceSlug ?? null} />;
}
import { getStoredUser, isAuthenticated, setAuthToken, setStoredUser } from './lib/auth';
import { api } from './lib/api';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { OrdersManagement } from './pages/dashboard/OrdersManagement';
import { Analytics } from './pages/dashboard/Analytics';
import { CustomersManagement } from './pages/dashboard/CustomersManagement';
import { FinancePricing } from './pages/dashboard/FinancePricing';
import { ServicesManagement } from './pages/dashboard/ServicesManagement';
import { WorksManagement } from './pages/dashboard/WorksManagement';
import { Archive } from './pages/dashboard/Archive';
import { Studio } from './pages/Studio';
import './index.css';

function PublicLayout() {
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  if (isSettingsPage) {
    return <Outlet />;
  }
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

function OrderFlowLayout() {
  return <Outlet />;
}

function DashboardGuard({ children, authReady }: { children: ReactElement; authReady: boolean }) {
  if (!authReady) {
    return <div className="page-loading">جاري التحميل...</div>;
  }
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = getStoredUser();
  if (!user || !['مدير', 'موظف'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const authBootstrapStartedRef = useRef(false);

  useEffect(() => {
    if (authBootstrapStartedRef.current) return;
    authBootstrapStartedRef.current = true;

    (async () => {
      try {
        const { data } = await api.post<{ access_token: string }>('/auth/refresh');
        setAuthToken(data.access_token);
        const { data: me } = await api.get<{ id: string; name: string; email: string | null; phone: string | null; role: string }>('/auth/me');
        setStoredUser(me);
      } catch {
        // لا جلسة — المستخدم غير مسجّل دخول
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  return (
    <I18nProvider>
      <BrowserRouter>
        {!authReady ? (
          <div className="page-loading">جاري التحميل...</div>
        ) : (
        <Routes>
          <Route path="/order" element={<OrderFlowLayout />}>
            <Route path="location" element={<Suspense fallback={<div className="page-loading">جاري التحميل...</div>}><DeliveryLocationPage /></Suspense>} />
            <Route path=":serviceSlug" element={<ServicesCatalogWithOrder />} />
            <Route index element={<Navigate to="/services" replace />} />
          </Route>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/services" element={<ServicesCatalog />} />
            <Route path="/services/:category" element={<ServicesCatalog />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/order/reorder/:orderId" element={<ReorderPage />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <DashboardGuard authReady={authReady}>
                <DashboardLayout />
              </DashboardGuard>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="customers" element={<CustomersManagement />} />
            <Route path="services" element={<ServicesManagement />} />
            <Route path="works" element={<WorksManagement />} />
            <Route path="archive" element={<Archive />} />
            <Route path="finance" element={<FinancePricing />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>

          <Route
            path="/studio"
            element={
              <DashboardGuard authReady={authReady}>
                <Studio />
              </DashboardGuard>
            }
          />
        </Routes>
        )}
      </BrowserRouter>
    </I18nProvider>
  );
}
