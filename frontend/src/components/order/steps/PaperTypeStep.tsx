import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function PaperTypeStep({ orderData, updateData, stepConfig, locale }: Props) {
  const paperTypes: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.paper_types || [];
  const showScale = stepConfig.show_scale ?? false;

  return (
    <div>
      {/* Paper Type */}
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'نوع الورق' : 'Paper Type'}
        </span>
        <div className="radio-cards">
          {paperTypes.map((pt) => (
            <label
              key={pt.value}
              className={`radio-card${orderData.paper_type === pt.value ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="paper_type"
                value={pt.value}
                checked={orderData.paper_type === pt.value}
                onChange={() => updateData('paper_type', pt.value)}
              />
              {locale === 'ar' ? pt.labelAr : (pt.labelEn || pt.labelAr)}
            </label>
          ))}
        </div>
      </div>

      {/* Print Color */}
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
              name="paper_print_color"
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
              name="paper_print_color"
              value="color"
              checked={orderData.print_color === 'color'}
              onChange={() => updateData('print_color', 'color')}
            />
            {locale === 'ar' ? 'ألوان' : 'Color'}
          </label>
        </div>
      </div>

      {/* Scale */}
      {showScale && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'هل تحتاج تحجيم (Scale)؟' : 'Do you need scaling?'}
          </span>
          <div className="radio-cards">
            <label
              className={`radio-card${orderData.needs_scale ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="needs_scale"
                checked={orderData.needs_scale}
                onChange={() => updateData('needs_scale', true)}
              />
              {locale === 'ar' ? 'نعم' : 'Yes'}
            </label>
            <label
              className={`radio-card${!orderData.needs_scale ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="needs_scale"
                checked={!orderData.needs_scale}
                onChange={() => updateData('needs_scale', false)}
              />
              {locale === 'ar' ? 'لا' : 'No'}
            </label>
          </div>

          {orderData.needs_scale && (
            <div style={{ marginTop: 12 }}>
              <input
                type="text"
                className="step-input"
                placeholder={locale === 'ar' ? 'أدخل قيمة التحجيم (مثال: 1:100)' : 'Enter scale value (e.g. 1:100)'}
                value={orderData.scale_value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData('scale_value', e.target.value)
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
