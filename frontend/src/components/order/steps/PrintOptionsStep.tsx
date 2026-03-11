import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function PrintOptionsStep({ orderData, updateData, stepConfig, locale }: Props) {
  const paperSizes: string[] = stepConfig.paper_sizes || [];
  const showBooklet = stepConfig.show_booklet ?? false;
  const showColor = stepConfig.show_color ?? true;
  const showQuality = stepConfig.show_quality ?? false;
  const showSides = stepConfig.show_sides ?? true;

  return (
    <div>
      {/* Paper Size */}
      {paperSizes.length > 0 && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'قياس الورق' : 'Paper Size'}
          </span>
          <div className="radio-cards">
            {paperSizes.map((size: string) => (
              <label
                key={size}
                className={`radio-card${orderData.paper_size === size ? ' radio-card--selected' : ''}`}
              >
                <input
                  type="radio"
                  name="paper_size"
                  value={size}
                  checked={orderData.paper_size === size}
                  onChange={() => updateData('paper_size', size)}
                />
                {size}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Print Color */}
      {showColor && (
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
                name="print_color"
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
                name="print_color"
                value="color"
                checked={orderData.print_color === 'color'}
                onChange={() => updateData('print_color', 'color')}
              />
              {locale === 'ar' ? 'ألوان' : 'Color'}
            </label>
          </div>
        </div>
      )}

      {/* Print Quality */}
      {showQuality && orderData.print_color === 'color' && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'جودة الطباعة' : 'Print Quality'}
          </span>
          <div className="radio-cards">
            <label
              className={`radio-card${orderData.print_quality === 'standard' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="print_quality"
                value="standard"
                checked={orderData.print_quality === 'standard'}
                onChange={() => updateData('print_quality', 'standard')}
              />
              {locale === 'ar' ? 'عادية' : 'Standard'}
            </label>
            <label
              className={`radio-card${orderData.print_quality === 'laser' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="print_quality"
                value="laser"
                checked={orderData.print_quality === 'laser'}
                onChange={() => updateData('print_quality', 'laser')}
              />
              {locale === 'ar' ? 'ليزر' : 'Laser'}
            </label>
          </div>
        </div>
      )}

      {/* Print Sides */}
      {showSides && (
        <div className="step-section">
          <span className="step-section__label">
            {locale === 'ar' ? 'طباعة الوجه' : 'Print Sides'}
          </span>
          <div className="radio-cards">
            <label
              className={`radio-card${orderData.print_sides === 'single' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="print_sides"
                value="single"
                checked={orderData.print_sides === 'single'}
                onChange={() => updateData('print_sides', 'single')}
              />
              {locale === 'ar' ? 'وجه واحد' : 'Single Side'}
            </label>
            <label
              className={`radio-card${orderData.print_sides === 'double' ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="print_sides"
                value="double"
                checked={orderData.print_sides === 'double'}
                onChange={() => updateData('print_sides', 'double')}
              />
              {locale === 'ar' ? 'وجهين' : 'Double Side'}
            </label>
          </div>
        </div>
      )}

      {/* Booklet */}
      {showBooklet && (
        <div className="step-section">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={orderData.booklet}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateData('booklet', e.target.checked)
              }
            />
            <span>{locale === 'ar' ? 'طباعة ككتيب (Booklet)' : 'Print as Booklet'}</span>
          </label>
        </div>
      )}
    </div>
  );
}
