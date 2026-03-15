import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function CardTypeStep({ orderData, updateData, stepConfig, locale }: Props) {
  const cardTypes: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.card_types || [];
  const showPrintColor = stepConfig.show_print_color ?? false;

  return (
    <div>
      {/* Card Type Selection */}
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'نوع الكرت' : 'Card Type'}
        </span>
        <div className="radio-cards">
          {cardTypes.map((ct) => (
            <label
              key={ct.value}
              className={`radio-card${orderData.card_type === ct.value ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="card_type"
                value={ct.value}
                checked={orderData.card_type === ct.value}
                onChange={() => updateData('card_type', ct.value)}
              />
              {locale === 'ar' ? ct.labelAr : (ct.labelEn || ct.labelAr)}
            </label>
          ))}
        </div>
      </div>

      {/* Print Color */}
      {showPrintColor && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'نوع الطباعة' : 'Print Color'}
          </span>
          <div className="radio-cards">
            <label
              className={`radio-card${orderData.print_color === 'bw' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="card_print_color"
                value="bw"
                checked={orderData.print_color === 'bw'}
                onChange={() => updateData('print_color', 'bw')}
              />
              {locale === 'ar' ? 'أبيض وأسود' : 'Black & White'}
            </label>
            <label
              className={`radio-card${orderData.print_color === 'color' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="card_print_color"
                value="color"
                checked={orderData.print_color === 'color'}
                onChange={() => updateData('print_color', 'color')}
              />
              {locale === 'ar' ? 'ألوان' : 'Color'}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
