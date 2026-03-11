import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function ClothingSourceStep({ orderData, updateData, stepConfig, locale }: Props) {
  const sources: { value: string; labelAr: string; labelEn?: string }[] =
    stepConfig.sources || [];

  return (
    <div>
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'مصدر الملابس' : 'Clothing Source'}
        </span>
        <div className="radio-cards">
          {sources.map((src) => (
            <label
              key={src.value}
              className={`radio-card${orderData.clothing_source === src.value ? ' radio-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="clothing_source"
                value={src.value}
                checked={orderData.clothing_source === src.value}
                onChange={() => updateData('clothing_source', src.value)}
              />
              {locale === 'ar' ? src.labelAr : (src.labelEn || src.labelAr)}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
