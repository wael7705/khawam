import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function BindingOptionsStep({ orderData, updateData, stepConfig, locale }: Props) {
  const bindingTypes: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.binding_types || [];
  const coverTypes: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.cover_types || [];
  const showCoverWhen: string[] = stepConfig.show_cover_type_when || [];

  const shouldShowCover =
    coverTypes.length > 0 && showCoverWhen.includes(orderData.binding_type);

  return (
    <div>
      {/* Binding Type */}
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'نوع التجليد' : 'Binding Type'}
        </span>
        <div className="radio-cards">
          {bindingTypes.map((bt) => (
            <label
              key={bt.value}
              className={`radio-card${orderData.binding_type === bt.value ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="binding_type"
                value={bt.value}
                checked={orderData.binding_type === bt.value}
                onChange={() => updateData('binding_type', bt.value)}
              />
              {locale === 'ar' ? bt.labelAr : (bt.labelEn || bt.labelAr)}
            </label>
          ))}
        </div>
      </div>

      {/* Cover Type */}
      {shouldShowCover && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'نوع الغلاف' : 'Cover Type'}
          </span>
          <div className="radio-cards">
            {coverTypes.map((ct) => (
              <label
                key={ct.value}
                className={`radio-card${orderData.cover_type === ct.value ? ' radio-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="cover_type"
                  value={ct.value}
                  checked={orderData.cover_type === ct.value}
                  onChange={() => updateData('cover_type', ct.value)}
                />
                {locale === 'ar' ? ct.labelAr : (ct.labelEn || ct.labelAr)}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
