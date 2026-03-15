import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { authAPI } from '../lib/api';
import { storeAuth, getAuthToken, getAuthErrorDetail } from '../lib/auth';
import type { UserData, LoginResponsePayload } from '../lib/auth';
import './Register.css';

type Step = 'form' | 'phone-confirm';

export function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register({
        name,
        phone: phone || undefined,
        email: email || undefined,
        password,
      });
      const { data } = await authAPI.login(email || phone || name, password);
      const payload = data as LoginResponsePayload;
      const token = payload.access_token;
      if (!token) {
        setError('Registration failed');
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
      } else {
        const userRes = await authAPI.getMe();
        user = userRes.data as UserData;
      }
      storeAuth(token, user);
      if (!user.phone || user.phone.trim() === '') {
        setStep('phone-confirm');
        setLoading(false);
      } else {
        navigate('/');
      }
    } catch (err: unknown) {
      setError(getAuthErrorDetail(err) || 'Registration failed');
      setLoading(false);
    }
  };

  const handlePhoneConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.updateProfile({ phone: phoneConfirm });
      const userRes = await authAPI.getMe();
      const user = userRes.data as UserData;
      const token = getAuthToken();
      if (token && user) {
        storeAuth(token, user);
      }
      navigate('/');
    } catch (err: unknown) {
      setError(getAuthErrorDetail(err) || 'Failed to save phone');
      setLoading(false);
    }
  };

  if (step === 'phone-confirm') {
    return (
      <div className="register-page">
        <div className="register-card">
          <img src="/images/logo.jpeg" alt="" className="register-card__logo" />
          <h1 className="register-card__title">{t.auth.confirmPhone}</h1>
          <p className="register-card__desc">{t.auth.confirmPhoneDesc}</p>
          <form onSubmit={handlePhoneConfirm} className="register-card__form">
            <input
              type="tel"
              placeholder={t.auth.phone}
              value={phoneConfirm}
              onChange={(e) => setPhoneConfirm(e.target.value)}
              className="register-card__input"
              required
            />
            {error && <p className="register-card__error">{error}</p>}
            <button type="submit" className="btn btn-primary register-card__submit" disabled={loading}>
              {loading ? '...' : t.auth.submit}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-card">
        <img src="/images/logo.jpeg" alt="" className="register-card__logo" />
        <h1 className="register-card__title">{t.auth.registerTitle}</h1>
        <form onSubmit={handleRegisterSubmit} className="register-card__form">
          <input
            type="text"
            placeholder={t.auth.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="register-card__input"
            required
            autoComplete="name"
          />
          <input
            type="tel"
            placeholder={t.auth.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="register-card__input"
            autoComplete="tel"
          />
          <input
            type="email"
            placeholder={t.auth.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-card__input"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder={t.auth.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-card__input"
            required
            autoComplete="new-password"
          />
          {error && <p className="register-card__error">{error}</p>}
          <button type="submit" className="btn btn-primary register-card__submit" disabled={loading}>
            {loading ? '...' : t.auth.register}
          </button>
        </form>
        <p className="register-card__footer">
          {t.auth.hasAccount}{' '}
          <Link to="/login" className="register-card__link">
            {t.auth.login}
          </Link>
        </p>
      </div>
    </div>
  );
}
