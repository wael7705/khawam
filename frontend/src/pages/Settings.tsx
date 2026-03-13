import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { authAPI } from '../lib/api';
import { getStoredUser, storeAuth, isAuthenticated, getAuthToken } from '../lib/auth';
import type { UserData } from '../lib/auth';
import './Settings.css';

export function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(getStoredUser());
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await authAPI.updateProfile({ name, phone, email });
      const updated = data.user as UserData;
      const token = getAuthToken() ?? '';
      storeAuth(token, updated);
      setUser(updated);
      setMessage(data.message as string);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail ?? 'حدث خطأ');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-card">
        <h2>{t.nav.settings}</h2>
        <form onSubmit={(e) => void handleSave(e)}>
          <div className="field">
            <label>{t.auth.name}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.auth.phone}</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label>{t.auth.email}</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}
          <button type="submit" className="btn btn-primary settings-btn">{t.auth.submit}</button>
        </form>
      </div>
    </div>
  );
}
