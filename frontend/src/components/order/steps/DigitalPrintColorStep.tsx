import { useCallback, type ChangeEvent } from 'react';
import type { DigitalColorMode, OrderData } from '../OrderWizard';

const MODES: { value: DigitalColorMode; ar: string; en: string }[] = [
  { value: 'silver', ar: 'فضي', en: 'Silver' },
  { value: 'gold', ar: 'ذهبي', en: 'Gold' },
  { value: 'black', ar: 'أسود', en: 'Black' },
  { value: 'white', ar: 'أبيض', en: 'White' },
  { value: 'file', ar: 'ألوان الملف كما هي', en: 'As in file' },
  { value: 'custom', ar: 'لون محدد (HEX)', en: 'Custom (HEX)' },
];

function normalizeHex(input: string): string {
  let s = input.trim();
  if (s === '') return '#000000';
  if (!s.startsWith('#')) s = `#${s}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) return s.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(s)) {
    const r = s[1];
    const g = s[2];
    const b = s[3];
    return (`#${r}${r}${g}${g}${b}${b}`).toUpperCase();
  }
  return s.length >= 7 ? s.slice(0, 7).toUpperCase() : s;
}

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, unknown>;
  locale: 'ar' | 'en';
}

export function DigitalPrintColorStep({ orderData, updateData, locale, stepConfig }: Props) {
  void stepConfig;

  const onModeChange = (value: DigitalColorMode) => {
    updateData('digital_color_mode', value);
  };

  const onHexInput = (e: ChangeEvent<HTMLInputElement>) => {
    updateData('digital_custom_hex', normalizeHex(e.target.value));
  };

  const onColorPicker = (e: ChangeEvent<HTMLInputElement>) => {
    updateData('digital_custom_hex', normalizeHex(e.target.value));
  };

  const copyHex = useCallback(() => {
    const hex = normalizeHex(orderData.digital_custom_hex);
    void navigator.clipboard?.writeText(hex);
  }, [orderData.digital_custom_hex]);

  const pickerValue =
    normalizeHex(orderData.digital_custom_hex).length === 7
      ? normalizeHex(orderData.digital_custom_hex)
      : '#000000';

  return (
    <div className="step-section">
      <span className="step-section__label">
        {locale === 'ar' ? 'لون الطباعة' : 'Print color'}
      </span>
      <div className="print-options-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MODES.map((m) => (
          <label key={m.value} className="print-option" style={{ cursor: 'pointer' }}>
            <input
              type="radio"
              name="digital_color_mode"
              checked={orderData.digital_color_mode === m.value}
              onChange={() => onModeChange(m.value)}
            />
            <span>{locale === 'ar' ? m.ar : m.en}</span>
          </label>
        ))}
      </div>

      {orderData.digital_color_mode === 'custom' && (
        <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="step-section__label" style={{ fontSize: '0.85rem' }}>
              {locale === 'ar' ? 'اختيار لون' : 'Pick color'}
            </span>
            <input type="color" value={pickerValue} onChange={onColorPicker} aria-label={locale === 'ar' ? 'لون' : 'Color'} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
            <span className="step-section__label" style={{ fontSize: '0.85rem' }}>
              HEX
            </span>
            <input
              type="text"
              className="step-input"
              value={orderData.digital_custom_hex}
              onChange={onHexInput}
              placeholder="#RRGGBB"
              spellCheck={false}
            />
          </label>
          <button type="button" className="wizard-nav__btn wizard-nav__btn--secondary" onClick={copyHex}>
            {locale === 'ar' ? 'نسخ الكود' : 'Copy HEX'}
          </button>
        </div>
      )}
    </div>
  );
}
