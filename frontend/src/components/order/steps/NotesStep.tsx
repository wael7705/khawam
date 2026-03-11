import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  locale: 'ar' | 'en';
}

export function NotesStep({ orderData, updateData, locale }: Props) {
  return (
    <div>
      <div className="step-section">
        <span className="step-section__label">
          {locale === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
        </span>
        <textarea
          className="step-textarea"
          rows={5}
          placeholder={
            locale === 'ar'
              ? 'اكتب أي ملاحظات أو تعليمات خاصة بالطلب...'
              : 'Write any special notes or instructions...'
          }
          value={orderData.notes}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            updateData('notes', e.target.value)
          }
        />
      </div>
    </div>
  );
}
