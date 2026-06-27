import { useLocation } from 'react-router-dom';
import { KhawamAssistant } from './KhawamAssistant';

/** يظهر المساعد في صفحات المتجر العامة فقط (ليس لوحة التحكم). */
export function StoreAssistant() {
  const location = useLocation();
  const path = location.pathname;

  const hidden =
    path.startsWith('/dashboard') ||
    path.startsWith('/studio') ||
    path.startsWith('/login') ||
    path.startsWith('/register');

  if (hidden) return null;
  return <KhawamAssistant />;
}
