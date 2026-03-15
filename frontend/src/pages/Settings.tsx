import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { authAPI, savedLocationsAPI, type SavedLocationItem } from '../lib/api';
import { getStoredUser, storeAuth, isAuthenticated, getAuthToken } from '../lib/auth';
import type { UserData } from '../lib/auth';
import './Settings.css';

function getLabelName(label: string, locale: 'ar' | 'en') {
  if (label === 'home') return locale === 'ar' ? 'البيت' : 'Home';
  if (label === 'work') return locale === 'ar' ? 'العمل' : 'Work';
  return locale === 'ar' ? 'أخرى' : 'Other';
}

function shortAddress(loc: SavedLocationItem): string {
  const parts = [loc.street, loc.neighborhood, loc.building_floor, loc.extra].filter(Boolean) as string[];
  if (parts.length) return parts.join('، ');
  if (loc.latitude != null && loc.longitude != null) return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
  return '';
}

export function Settings() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(getStoredUser());
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStreet, setEditStreet] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editBuildingFloor, setEditBuildingFloor] = useState('');
  const [editExtra, setEditExtra] = useState('');
  const [locationsError, setLocationsError] = useState('');
  const [locationsMessage, setLocationsMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!isAuthenticated()) return;
    setLocationsLoading(true);
    setLocationsError('');
    savedLocationsAPI
      .list()
      .then((res) => {
        const list = (res.data as { data?: SavedLocationItem[] })?.data ?? [];
        setSavedLocations(Array.isArray(list) ? list : []);
      })
      .catch(() => setLocationsError(locale === 'ar' ? 'تعذر تحميل المواقع' : 'Failed to load locations'))
      .finally(() => setLocationsLoading(false));
  }, [locale]);

  const startEdit = (loc: SavedLocationItem) => {
    setEditingId(loc.id);
    setEditStreet(loc.street ?? '');
    setEditNeighborhood(loc.neighborhood ?? '');
    setEditBuildingFloor(loc.building_floor ?? '');
    setEditExtra(loc.extra ?? '');
    setLocationsMessage('');
    setLocationsError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLocationsError('');
    setLocationsMessage('');
    try {
      await savedLocationsAPI.update(editingId, {
        street: editStreet || null,
        neighborhood: editNeighborhood || null,
        building_floor: editBuildingFloor || null,
        extra: editExtra || null,
      });
      setLocationsMessage(locale === 'ar' ? 'تم تحديث الموقع' : 'Location updated');
      setEditingId(null);
      const { data } = await savedLocationsAPI.list();
      const list = (data as { data?: SavedLocationItem[] })?.data ?? [];
      setSavedLocations(Array.isArray(list) ? list : []);
    } catch {
      setLocationsError(locale === 'ar' ? 'تعذر تحديث الموقع' : 'Failed to update location');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'حذف هذا الموقع؟' : 'Delete this location?')) return;
    setLocationsError('');
    try {
      await savedLocationsAPI.delete(id);
      setSavedLocations((prev) => prev.filter((l) => l.id !== id));
      if (editingId === id) setEditingId(null);
    } catch {
      setLocationsError(locale === 'ar' ? 'تعذر حذف الموقع' : 'Failed to delete location');
    }
  };

  const goToMapToEdit = (id: string) => {
    navigate('/order/location', { state: { editLocationId: id, returnPath: '/settings' } });
  };

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

        <section className="settings-saved-locations">
          <h3 className="settings-saved-locations__title">
            {locale === 'ar' ? 'مواقع التوصيل المحفوظة' : 'Saved delivery locations'}
          </h3>
          {locationsLoading && (
            <p className="settings-saved-locations__loading">
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </p>
          )}
          {locationsError && <p className="form-error">{locationsError}</p>}
          {locationsMessage && <p className="form-success">{locationsMessage}</p>}
          {!locationsLoading && savedLocations.length === 0 && (
            <p className="settings-saved-locations__empty">
              {locale === 'ar' ? 'لا توجد مواقع محفوظة. يمكنك حفظ موقع من صفحة الخريطة عند الطلب.' : 'No saved locations. You can save one from the map when placing an order.'}
            </p>
          )}
          <div className="settings-saved-locations__list">
            {savedLocations.map((loc) => (
              <div key={loc.id} className="settings-location-card">
                <div className="settings-location-card__main">
                  <span className="settings-location-card__label">{getLabelName(loc.label, locale)}</span>
                  <span className="settings-location-card__address">{shortAddress(loc) || (locale === 'ar' ? '—' : '—')}</span>
                  {loc.latitude != null && loc.longitude != null && (
                    <span className="settings-location-card__coords">
                      {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                    </span>
                  )}
                </div>
                {editingId === loc.id ? (
                  <form onSubmit={(e) => void handleUpdateLocation(e)} className="settings-location-edit">
                    <div className="field">
                      <label>{locale === 'ar' ? 'الشارع' : 'Street'}</label>
                      <input value={editStreet} onChange={(e) => setEditStreet(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{locale === 'ar' ? 'الحي' : 'Neighborhood'}</label>
                      <input value={editNeighborhood} onChange={(e) => setEditNeighborhood(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{locale === 'ar' ? 'المبنى/الطابق' : 'Building/Floor'}</label>
                      <input value={editBuildingFloor} onChange={(e) => setEditBuildingFloor(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>{locale === 'ar' ? 'تفاصيل إضافية' : 'Extra'}</label>
                      <input value={editExtra} onChange={(e) => setEditExtra(e.target.value)} />
                    </div>
                    <div className="settings-location-edit__actions">
                      <button type="submit" className="btn btn-primary">
                        {locale === 'ar' ? 'حفظ' : 'Save'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                        {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => goToMapToEdit(loc.id)}>
                        {locale === 'ar' ? 'تحديد موقع آخر على الخريطة' : 'Set location on map'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="settings-location-card__actions">
                    <button type="button" className="btn btn-secondary" onClick={() => startEdit(loc)}>
                      {locale === 'ar' ? 'تعديل' : 'Edit'}
                    </button>
                    <button type="button" className="btn btn-secondary settings-location-card__delete" onClick={() => void handleDeleteLocation(loc.id)}>
                      {locale === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
