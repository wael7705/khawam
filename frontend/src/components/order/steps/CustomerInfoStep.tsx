import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle } from 'lucide-react';
import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  locale: 'ar' | 'en';
  serviceSlug?: string;
}

export function CustomerInfoStep({ orderData, updateData, locale, serviceSlug }: Props) {
  const navigate = useNavigate();

  const openLocationPage = () => {
    navigate('/order/location', { state: { serviceSlug: serviceSlug ?? '' } });
  };

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

      {/* Delivery: location button + address fields + confirmed badge */}
      {orderData.delivery_type === 'delivery' && (
        <div className="customer-field">
          <label className="customer-field__label">
            {locale === 'ar' ? 'موقع التوصيل' : 'Delivery Location'}
          </label>
          <button
            type="button"
            className="delivery-location-btn"
            onClick={openLocationPage}
          >
            <MapPin size={18} />
            {locale === 'ar' ? 'تحديد موقع التوصيل على الخريطة' : 'Set delivery location on map'}
          </button>
          {orderData.delivery_location_confirmed && (
            <div className="delivery-location-confirmed">
              <CheckCircle size={18} />
              <span>{locale === 'ar' ? 'تم تأكيد موقع التوصيل' : 'Delivery location confirmed'}</span>
            </div>
          )}
          <label className="customer-field__label" style={{ marginTop: 12 }}>
            {locale === 'ar' ? 'الشارع' : 'Street'}
          </label>
          <input
            type="text"
            className="step-input"
            placeholder={locale === 'ar' ? 'الشارع...' : 'Street...'}
            value={orderData.delivery_street}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData('delivery_street', e.target.value)
            }
          />
          <label className="customer-field__label" style={{ marginTop: 12 }}>
            {locale === 'ar' ? 'الحي' : 'Neighborhood'}
          </label>
          <input
            type="text"
            className="step-input"
            placeholder={locale === 'ar' ? 'الحي...' : 'Neighborhood...'}
            value={orderData.delivery_neighborhood}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData('delivery_neighborhood', e.target.value)
            }
          />
          <label className="customer-field__label" style={{ marginTop: 12 }}>
            {locale === 'ar' ? 'المبنى / الطابق' : 'Building / Floor'}
          </label>
          <input
            type="text"
            className="step-input"
            placeholder={locale === 'ar' ? 'مبنى، طابق...' : 'Building, floor...'}
            value={orderData.delivery_building_floor}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData('delivery_building_floor', e.target.value)
            }
          />
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
