import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { MapPin, CheckCircle, Home, Briefcase, MapPinned } from 'lucide-react';
import { isAuthenticated } from '../../../lib/auth';
import { savedLocationsAPI, type SavedLocationItem } from '../../../lib/api';
import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  locale: 'ar' | 'en';
  serviceSlug?: string;
  onBeforeNavigateToMap?: () => void;
}

function applySavedLocationToOrder(loc: SavedLocationItem, updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void) {
  const parts = [loc.street, loc.neighborhood, loc.building_floor, loc.extra].filter(Boolean) as string[];
  const address = parts.join('، ') || (loc.latitude != null && loc.longitude != null ? `${loc.latitude}, ${loc.longitude}` : '');
  updateData('delivery_street', loc.street ?? '');
  updateData('delivery_neighborhood', loc.neighborhood ?? '');
  updateData('delivery_building_floor', loc.building_floor ?? '');
  updateData('delivery_extra', loc.extra ?? '');
  updateData('delivery_latitude', loc.latitude ?? null);
  updateData('delivery_longitude', loc.longitude ?? null);
  updateData('delivery_address', address);
  updateData('delivery_location_confirmed', true);
  const label = loc.label === 'home' || loc.label === 'work' || loc.label === 'other' ? loc.label : 'other';
  updateData('delivery_location_label', label);
}

function getLabelIcon(label: string) {
  if (label === 'home') return Home;
  if (label === 'work') return Briefcase;
  return MapPinned;
}

function getLabelName(label: string, locale: 'ar' | 'en') {
  if (label === 'home') return locale === 'ar' ? 'البيت' : 'Home';
  if (label === 'work') return locale === 'ar' ? 'العمل' : 'Work';
  return locale === 'ar' ? 'أخرى' : 'Other';
}

export function CustomerInfoStep({ orderData, updateData, locale, serviceSlug, onBeforeNavigateToMap }: Props) {
  const navigate = useNavigate();
  const [savedLocations, setSavedLocations] = useState<SavedLocationItem[]>([]);
  const [savedLocationsLoading, setSavedLocationsLoading] = useState(false);
  const deliveryFetchedRef = useRef(false);

  const openLocationPage = () => {
    updateData('delivery_location_label', null);
    onBeforeNavigateToMap?.();
    navigate('/order/location', { state: { serviceSlug: serviceSlug ?? '' } });
  };

  useEffect(() => {
    if (orderData.delivery_type !== 'delivery') {
      deliveryFetchedRef.current = false;
      return;
    }
    if (!isAuthenticated()) {
      openLocationPage();
      return;
    }
    if (deliveryFetchedRef.current) return;
    deliveryFetchedRef.current = true;
    setSavedLocationsLoading(true);
    savedLocationsAPI
      .list()
      .then((res) => {
        const list = res.data?.data ?? [];
        if (list.length === 0) {
          openLocationPage();
          return;
        }
        if (list.length === 1) {
          applySavedLocationToOrder(list[0]!, updateData);
          setSavedLocations([]);
        } else {
          setSavedLocations(list);
        }
      })
      .catch(() => {
        openLocationPage();
      })
      .finally(() => {
        setSavedLocationsLoading(false);
      });
  }, [orderData.delivery_type, serviceSlug, updateData]);

  return (
    <div className="customer-fields">
      {/* Name */}
      <div className="customer-field">
        <label className="customer-field__label">
          {locale === 'ar' ? 'الاسم' : 'Name'} <span>*</span>
        </label>
        <input
          type="text"
          className="step-input"
          placeholder={locale === 'ar' ? 'الاسم الكامل' : 'Full name'}
          value={orderData.customer_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateData('customer_name', e.target.value)
          }
          required
        />
      </div>

      {/* WhatsApp */}
      <div className="customer-field">
        <label className="customer-field__label">
          {locale === 'ar' ? 'رقم الواتساب' : 'WhatsApp Number'} <span>*</span>
        </label>
        <input
          type="tel"
          className="step-input"
          placeholder="09XXXXXXXX"
          value={orderData.customer_whatsapp}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateData('customer_whatsapp', e.target.value)
          }
          required
          dir="ltr"
        />
      </div>

      {/* Extra Phone */}
      <div className="customer-field">
        <label className="customer-field__label">
          {locale === 'ar' ? 'رقم إضافي (اختياري)' : 'Extra Phone (optional)'}
        </label>
        <input
          type="tel"
          className="step-input"
          placeholder={locale === 'ar' ? 'رقم هاتف إضافي' : 'Extra phone number'}
          value={orderData.customer_phone_extra}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateData('customer_phone_extra', e.target.value)
          }
          dir="ltr"
        />
      </div>

      {/* Shop Name */}
      <div className="customer-field">
        <label className="customer-field__label">
          {locale === 'ar' ? 'اسم المحل (اختياري)' : 'Shop Name (optional)'}
        </label>
        <input
          type="text"
          className="step-input"
          placeholder={locale === 'ar' ? 'اسم المحل أو الجهة' : 'Shop or company name'}
          value={orderData.shop_name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateData('shop_name', e.target.value)
          }
        />
      </div>

      {/* Delivery Type */}
      <div className="customer-field">
        <label className="customer-field__label">
          {locale === 'ar' ? 'طريقة الاستلام' : 'Delivery Method'}
        </label>
        <div className="delivery-cards">
          <label
            className={`delivery-card${orderData.delivery_type === 'self' ? ' delivery-card--selected' : ''}`}
          >
            <input
              type="radio"
              name="delivery_type"
              value="self"
              checked={orderData.delivery_type === 'self'}
              onChange={() => updateData('delivery_type', 'self')}
            />
            <span className="delivery-card__icon">🏪</span>
            <span className="delivery-card__title">
              {locale === 'ar' ? 'استلام من المحل' : 'Self Pickup'}
            </span>
          </label>
          <label
            className={`delivery-card${orderData.delivery_type === 'delivery' ? ' delivery-card--selected' : ''}`}
          >
            <input
              type="radio"
              name="delivery_type"
              value="delivery"
              checked={orderData.delivery_type === 'delivery'}
              onChange={() => updateData('delivery_type', 'delivery')}
            />
            <span className="delivery-card__icon">🚚</span>
            <span className="delivery-card__title">
              {locale === 'ar' ? 'توصيل' : 'Delivery'}
            </span>
          </label>
        </div>
      </div>

      {/* Delivery: saved locations list or map button + address fields + confirmed badge */}
      {orderData.delivery_type === 'delivery' && (
        <div className="customer-field">
          <label className="customer-field__label">
            {locale === 'ar' ? 'موقع التوصيل' : 'Delivery Location'}
          </label>
          {savedLocationsLoading && (
            <p className="customer-field__hint" style={{ marginBottom: 8 }}>
              {locale === 'ar' ? 'جاري تحميل المواقع المحفوظة...' : 'Loading saved locations...'}
            </p>
          )}
          {!savedLocationsLoading && savedLocations.length > 1 && (
            <div className="saved-locations-cards">
              {savedLocations.map((loc) => {
                const Icon = getLabelIcon(loc.label);
                const name = getLabelName(loc.label, locale);
                const short = [loc.street, loc.neighborhood].filter(Boolean).join(' — ') || (loc.latitude != null && loc.longitude != null ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : '');
                return (
                  <button
                    key={loc.id}
                    type="button"
                    className="saved-location-card"
                    onClick={() => {
                      applySavedLocationToOrder(loc, updateData);
                      setSavedLocations([]);
                    }}
                  >
                    <Icon size={20} />
                    <span className="saved-location-card__name">{name}</span>
                    {short && <span className="saved-location-card__short">{short}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            className="delivery-location-btn"
            onClick={openLocationPage}
          >
            <MapPin size={18} />
            {locale === 'ar' ? 'تحديد موقع التوصيل على الخريطة' : 'Set delivery location on map'}
          </button>
          {orderData.delivery_location_confirmed && (
            <div className="delivery-location-confirmed-wrap">
              <div className="delivery-location-confirmed">
                <CheckCircle size={18} />
                <span>
                  {orderData.delivery_location_label
                    ? (locale === 'ar' ? `الموقع: ${getLabelName(orderData.delivery_location_label, 'ar')}` : `Location: ${getLabelName(orderData.delivery_location_label, 'en')}`)
                    : (locale === 'ar' ? 'تم تحديد موقع جديد على الخريطة' : 'New location set on map')}
                </span>
              </div>
              <button
                type="button"
                className="delivery-location-btn delivery-location-btn--secondary"
                onClick={openLocationPage}
              >
                <MapPin size={16} />
                {locale === 'ar' ? 'إعادة تحديد الموقع على الخريطة' : 'Change location on map'}
              </button>
            </div>
          )}
          <label className="customer-field__label" style={{ marginTop: 12 }}>
            {locale === 'ar' ? 'تفاصيل إضافية' : 'Extra details'}
          </label>
          <textarea
            className="step-textarea"
            rows={2}
            placeholder={locale === 'ar' ? 'أي تفاصيل إضافية...' : 'Any extra details...'}
            value={orderData.delivery_extra}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              updateData('delivery_extra', e.target.value)
            }
          />
        </div>
      )}
    </div>
  );
}
