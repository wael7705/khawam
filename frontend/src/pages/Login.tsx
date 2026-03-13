import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Chrome, Smartphone } from 'lucide-react';
import { useTranslation } from '../i18n/index';
import { authAPI } from '../lib/api';
import { storeAuth } from '../lib/auth';
import type { UserData } from '../lib/auth';
import './Login.css';

export function Login() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await authAPI.login(username, password);
      const payload = data as { access_token?: string; user?: { id: string; name: string; email: string | null; phone: string | null; role: string } };
      const token = payload.access_token;
      if (!token) {
        setError('Invalid response from server');
        setLoading(false);
        return;
      }
      let user: UserData;
      if (payload.user) {
        user = {
          id: payload.user.id,
          name: payload.user.name,
          email: payload.user.email ?? null,
          phone: payload.user.phone ?? null,
          role: payload.user.role,
        };
        storeAuth(token, user);
        navigate(['مدير', 'موظف'].includes(user.role) ? '/dashboard' : '/');
      } else {
        const userRes = await authAPI.getMe();
        user = userRes.data as UserData;
        storeAuth(token, user);
        navigate(['مدير', 'موظف'].includes(user.role) ? '/dashboard' : '/');
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src="/images/logo.jpeg" alt="" className="login-card__logo" />
        <h1 className="login-card__title">{t.auth.loginTitle}</h1>
        <form onSubmit={handleSubmit} className="login-card__form">
          <input
            type="text"
            placeholder={t.auth.usernamePlaceholder}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-card__input"
            required
            autoComplete="username"
          />
          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-card__input"
            required
            autoComplete="current-password"
          />
          {error && <p className="login-card__error">{error}</p>}
          <button type="submit" className="btn btn-primary login-card__submit" disabled={loading}>
            {loading ? '...' : t.auth.login}
          </button>
        </form>
        <div className="login-card__divider">{t.auth.loginWith}</div>
        <div className="login-card__social">
          <button type="button" className="login-card__social-btn">
            <Chrome size={22} />
            {t.auth.google}
          </button>
          <button type="button" className="login-card__social-btn">
            <Smartphone size={22} />
            {t.auth.apple}
          </button>
        </div>
        <p className="login-card__footer">
          {t.auth.noAccount}{' '}
          <Link to="/register" className="login-card__link">
            {t.auth.register}
          </Link>
        </p>
      </div>
    </div>
  );
}
