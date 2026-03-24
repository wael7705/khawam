import type { ChangeEvent } from 'react';
import type { OrderData, UvCardboardWeightG, UvMaterialOption } from '../OrderWizard';

function readConfigNumber(config: Record<string, unknown>, key: string, defaultVal: number): number {
  const v = config[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return defaultVal;
}

const MATERIALS: { value: UvMaterialOption; ar: string; en: string }[] = [
  { value: 'vinyl', ar: 'فينيل', en: 'Vinyl' },
  { value: 'cardboard', ar: 'كرتون', en: 'Cardboard' },
  { value: 'cardboard_reinforced', ar: 'كرتون معجن', en: 'Reinforced cardboard' },
  { value: 'transparent', ar: 'شفافية', en: 'Transparent' },
  { value: 'leather', ar: 'جلد', en: 'Leather' },
  { value: 'fabric', ar: 'قماش', en: 'Fabric' },
  { value: 'plex', ar: 'بليكس', en: 'Plex' },
  { value: 'glass', ar: 'بلور / زجاج', en: 'Glass' },
  { value: 'other', ar: 'غير ذلك', en: 'Other' },
];

const WEIGHTS: UvCardboardWeightG[] = [160, 250, 300];

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, unknown>;
  locale: 'ar' | 'en';
}

export function UvMaterialStep({ orderData, updateData, stepConfig, locale }: Props) {
  const maxThickness = readConfigNumber(stepConfig, 'max_thickness_mm', 14);
  const needsCardboardWeight =
    orderData.uv_material_type === 'cardboard' || orderData.uv_material_type === 'cardboard_reinforced';

  const onMaterialChange = (value: UvMaterialOption) => {
    updateData('uv_material_type', value);
    if (value !== 'other') {
      updateData('uv_material_other_text', '');
    }
    if (value === 'cardboard' || value === 'cardboard_reinforced') {
      if (!WEIGHTS.includes(orderData.uv_cardboard_weight_g)) {
        updateData('uv_cardboard_weight_g', 160);
      }
    }
  };

  const onOtherText = (e: ChangeEvent<HTMLInputElement>) => {
    updateData('uv_material_other_text', e.target.value);
  };

  return (
    <div>
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'نوع المادة' : 'Substrate type'}
        </span>
        <select
          className="step-input"
          value={orderData.uv_material_type}
          onChange={(e) => onMaterialChange(e.target.value as UvMaterialOption)}
        >
          <option value="">
            {locale === 'ar' ? 'اختر المادة' : 'Select material'}
          </option>
          {MATERIALS.map((m) => (
            <option key={m.value} value={m.value}>
              {locale === 'ar' ? m.ar : m.en}
            </option>
          ))}
        </select>
      </div>

      {needsCardboardWeight && (
        <div className="step-section" style={{ marginTop: '1rem' }}>
          <span className="step-section__label">
            {locale === 'ar' ? 'وزن الكرتون (غ/م²)' : 'Cardboard weight (g/m²)'}
          </span>
          <div className="print-options-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {WEIGHTS.map((w) => (
              <label key={w} className="print-option" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="uv_cardboard_weight"
                  checked={orderData.uv_cardboard_weight_g === w}
                  onChange={() => updateData('uv_cardboard_weight_g', w)}
                />
                <span>{w}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {orderData.uv_material_type === 'other' && (
        <div className="step-section" style={{ marginTop: '1rem' }}>
          <span className="step-section__label">
            {locale === 'ar' ? 'صف المادة' : 'Describe the material'}
          </span>
          <input
            type="text"
            className="step-input"
            value={orderData.uv_material_other_text}
            onChange={onOtherText}
            placeholder={locale === 'ar' ? 'اكتب نوع المادة' : 'Material details'}
          />
        </div>
      )}

      <div
        className="step-section"
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          borderRadius: 8,
          background: 'var(--surface-muted, rgba(0,0,0,0.04))',
        }}
      >
        <p style={{ margin: 0, fontWeight: 600 }}>
          {locale === 'ar'
            ? `تنبيه: أقصى سماكة للطباعة UV هي ${maxThickness} مم.`
            : `Note: maximum printable thickness is ${maxThickness} mm.`}
        </p>
      </div>
    </div>
  );
}
