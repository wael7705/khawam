import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function ThesisBindingStep({ orderData, updateData, stepConfig, locale }: Props) {
  const bindingColors: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.binding_colors || [];
  const textColors: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.text_colors || [];
  const coverPrintTypes: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.cover_print_types || [];

  return (
    <div>
      {/* Binding Color */}
      {bindingColors.length > 0 && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'لون التجليد' : 'Binding Color'}
          </span>
          <div className="radio-cards">
            {bindingColors.map((bc) => (
              <label
                key={bc.value}
                className={`radio-card${orderData.binding_color === bc.value ? ' radio-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="binding_color"
                  value={bc.value}
                  checked={orderData.binding_color === bc.value}
                  onChange={() => updateData('binding_color', bc.value)}
                />
                {locale === 'ar' ? bc.labelAr : (bc.labelEn || bc.labelAr)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Text Color */}
      {textColors.length > 0 && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'لون الكتابة' : 'Text Color'}
          </span>
          <div className="radio-cards">
            {textColors.map((tc) => (
              <label
                key={tc.value}
                className={`radio-card${orderData.text_color === tc.value ? ' radio-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="text_color"
                  value={tc.value}
                  checked={orderData.text_color === tc.value}
                  onChange={() => updateData('text_color', tc.value)}
                />
                {locale === 'ar' ? tc.labelAr : (tc.labelEn || tc.labelAr)}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Cover Print Type */}
      {coverPrintTypes.length > 0 && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'نوع طباعة الغلاف' : 'Cover Print Type'}
          </span>
          <div className="radio-cards">
            {coverPrintTypes.map((cpt) => (
              <label
                key={cpt.value}
                className={`radio-card${orderData.cover_print_type === cpt.value ? ' radio-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="cover_print_type"
                  value={cpt.value}
                  checked={orderData.cover_print_type === cpt.value}
                  onChange={() => updateData('cover_print_type', cpt.value)}
                />
                {locale === 'ar' ? cpt.labelAr : (cpt.labelEn || cpt.labelAr)}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
