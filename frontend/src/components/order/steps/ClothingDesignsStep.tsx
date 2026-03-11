import { useRef, useCallback } from 'react';
import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

export function ClothingDesignsStep({ orderData, updateData, stepConfig, locale }: Props) {
  const rawPositions: { value: string; key?: string; labelAr: string; labelEn?: string }[] =
    stepConfig.positions || [];
  const positions = rawPositions.map((p) => ({ ...p, key: p.key || p.value }));
  const accept = stepConfig.accept || 'image/*';
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileChange = useCallback(
    (posKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      updateData('clothing_designs', { ...orderData.clothing_designs, [posKey]: file });
    },
    [orderData.clothing_designs, updateData],
  );

  const removeDesign = useCallback(
    (posKey: string) => {
      const updated = { ...orderData.clothing_designs };
      updated[posKey] = null;
      updateData('clothing_designs', updated);
      const input = fileRefs.current[posKey];
      if (input) input.value = '';
    },
    [orderData.clothing_designs, updateData],
  );

  return (
    <div>
      {/* Quantity */}
      <div className="quantity-row">
        <label>{locale === 'ar' ? 'الكمية:' : 'Quantity:'}</label>
        <input
          type="number"
          className="step-input"
          min={1}
          value={orderData.quantity}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            updateData('quantity', Math.max(1, parseInt(e.target.value) || 1))
          }
        />
      </div>

      {/* Design Positions */}
      {positions.length > 0 && (
        <div className="step-section" style={{ marginTop: 20 }}>
          <span className="step-section__label">
            {locale === 'ar' ? 'مواقع الطباعة' : 'Print Positions'}
          </span>
          <div className="designs-grid">
            {positions.map((pos) => {
              const hasFile = !!orderData.clothing_designs[pos.key];
              return (
                <div key={pos.key} className="design-position">
                  <span className="design-position__label">
                    {locale === 'ar' ? pos.labelAr : (pos.labelEn || pos.labelAr)}
                  </span>
                  {hasFile ? (
                    <div className={`design-position__upload design-position__upload--has-file`}>
                      <div className="design-position__file-info">
                        <span className="design-position__file-name">
                          {orderData.clothing_designs[pos.key]?.name}
                        </span>
                        <button
                          type="button"
                          className="design-position__remove"
                          onClick={() => removeDesign(pos.key)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="design-position__upload"
                      onClick={() => fileRefs.current[pos.key]?.click()}
                    >
                      {locale === 'ar' ? 'انقر لرفع التصميم' : 'Click to upload design'}
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      fileRefs.current[pos.key] = el;
                    }}
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileChange(pos.key, e)}
                    style={{ display: 'none' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
