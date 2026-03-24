import { useEffect, type ChangeEvent } from 'react';
import type { OrderData } from '../OrderWizard';
import {
  applyHeightFromWidth,
  applyWidthFromHeight,
  computeAspectRatio,
  isWithinMaxDimensions,
} from '../../../lib/order/digitalPrintMath';

function readConfigNumber(config: Record<string, unknown>, key: string): number | undefined {
  const v = config[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function readConfigString(config: Record<string, unknown>, key: string): string | undefined {
  const v = config[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function readConfigBool(config: Record<string, unknown>, key: string, defaultVal: boolean): boolean {
  const v = config[key];
  if (typeof v === 'boolean') return v;
  return defaultVal;
}

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, unknown>;
  locale: 'ar' | 'en';
  onSwitchServiceSlug?: (slug: string) => void;
}

export function DigitalDimensionsStep({
  orderData,
  updateData,
  stepConfig,
  locale,
  onSwitchServiceSlug,
}: Props) {
  const unit = typeof stepConfig.unit === 'string' ? stepConfig.unit : locale === 'ar' ? 'سم' : 'cm';
  const showAspect = readConfigBool(stepConfig, 'show_aspect_buttons', true);
  const maxW = readConfigNumber(stepConfig, 'max_width_cm');
  const maxH = readConfigNumber(stepConfig, 'max_height_cm');
  const fallbackSlug = readConfigString(stepConfig, 'fallback_service_slug');
  const hasMax = maxW != null && maxH != null && maxW > 0 && maxH > 0;

  useEffect(() => {
    const r = computeAspectRatio(orderData.width, orderData.height);
    if (r != null && orderData.digital_aspect_ratio !== r) {
      const prev = orderData.digital_aspect_ratio;
      if (prev == null || Math.abs(prev - r) > 1e-6) {
        updateData('digital_aspect_ratio', r);
      }
    }
  }, [orderData.width, orderData.height, orderData.digital_aspect_ratio, updateData]);

  const ratioForButtons =
    orderData.digital_aspect_ratio ?? computeAspectRatio(orderData.width, orderData.height) ?? 1;

  const handleFitFromHeight = () => {
    updateData('digital_aspect_ratio', ratioForButtons);
    updateData('digital_aspect_anchor', 'height');
    updateData('width', applyWidthFromHeight(orderData.height, ratioForButtons));
  };

  const handleFitFromWidth = () => {
    updateData('digital_aspect_ratio', ratioForButtons);
    updateData('digital_aspect_anchor', 'width');
    updateData('height', applyHeightFromWidth(orderData.width, ratioForButtons));
  };

  const overMax =
    hasMax &&
    orderData.width > 0 &&
    orderData.height > 0 &&
    !isWithinMaxDimensions(orderData.width, orderData.height, maxW, maxH);

  const onWidthChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateData('width', parseFloat(e.target.value) || 0);
  };

  const onHeightChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateData('height', parseFloat(e.target.value) || 0);
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
                onChange={onWidthChange}
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
                onChange={onHeightChange}
              />
              <span className="number-input-row__unit">{unit}</span>
            </div>
          </div>

          {showAspect && (
            <div className="dimension-inputs__group dimension-inputs__group--full">
              <button type="button" className="dimension-default-btn" onClick={handleFitFromHeight}>
                {locale === 'ar' ? 'تناسب حسب الطول (الارتفاع)' : 'Fit from height'}
              </button>
              <button type="button" className="dimension-default-btn" onClick={handleFitFromWidth}>
                {locale === 'ar' ? 'تناسب حسب العرض' : 'Fit from width'}
              </button>
            </div>
          )}
        </div>
      </div>

      {hasMax && (
        <p className="wizard-card__desc" style={{ marginTop: '0.75rem' }}>
          {locale === 'ar'
            ? `الحد الأقصى للطباعة UV: عرض ${String(maxW)} سم × ارتفاع ${String(maxH)} سم.`
            : `UV maximum: ${String(maxW)} cm × ${String(maxH)} cm.`}
        </p>
      )}

      {overMax && (
        <div
          className="step-section"
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: 'var(--surface-elevated, rgba(255, 180, 0, 0.12))',
            border: '1px solid rgba(255, 180, 0, 0.35)',
          }}
        >
          <p style={{ margin: 0, marginBottom: fallbackSlug && onSwitchServiceSlug ? '0.75rem' : 0 }}>
            {locale === 'ar'
              ? `المقاس يتجاوز حد UV (${String(maxW)}×${String(maxH)} سم). يمكنك تقليل الأبعاد أو الطلب عبر خدمة DTF للأحجام الأكبر.`
              : `Size exceeds UV limit (${String(maxW)}×${String(maxH)} cm). Reduce dimensions or order via DTF for larger sizes.`}
          </p>
          {fallbackSlug && onSwitchServiceSlug && (
            <button
              type="button"
              className="wizard-nav__btn wizard-nav__btn--primary"
              onClick={() => onSwitchServiceSlug(fallbackSlug)}
            >
              {locale === 'ar' ? 'الانتقال لطلب طباعة DTF' : 'Switch to DTF printing'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
