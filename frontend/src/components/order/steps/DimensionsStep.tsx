import { useEffect } from 'react';
import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function DimensionsStep({ orderData, updateData, stepConfig, locale }: Props) {
  const defaultWidth = stepConfig.default_width ?? 0;
  const defaultHeight = stepConfig.default_height ?? 0;
  const showUseDefault = stepConfig.show_use_default ?? false;
  const unit = stepConfig.unit || (locale === 'ar' ? 'سم' : 'cm');

  useEffect(() => {
    if (defaultWidth && orderData.width === 0) {
      updateData('width', defaultWidth);
    }
    if (defaultHeight && orderData.height === 0) {
      updateData('height', defaultHeight);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseDefault = () => {
    updateData('width', defaultWidth);
    updateData('height', defaultHeight);
  };

  return (
    <div>
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'الأبعاد' : 'Dimensions'}
        </span>
        <div className="dimension-inputs">
          <div className="dimension-inputs__group">
            <label>{locale === 'ar' ? 'العرض' : 'Width'}</label>
            <div className="number-input-row">
              <input
                type="number"
                className="step-input"
                min={0}
                step={0.1}
                value={orderData.width || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData('width', parseFloat(e.target.value) || 0)
                }
              />
              <span className="number-input-row__unit">{unit}</span>
            </div>
          </div>

          <span className="dimension-inputs__x">×</span>

          <div className="dimension-inputs__group">
            <label>{locale === 'ar' ? 'الارتفاع' : 'Height'}</label>
            <div className="number-input-row">
              <input
                type="number"
                className="step-input"
                min={0}
                step={0.1}
                value={orderData.height || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateData('height', parseFloat(e.target.value) || 0)
                }
              />
              <span className="number-input-row__unit">{unit}</span>
            </div>
          </div>

          {showUseDefault && (
            <button type="button" className="dimension-default-btn" onClick={handleUseDefault}>
              {locale === 'ar' ? 'القياس الافتراضي' : 'Use Default'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
