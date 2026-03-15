interface SubmitOverlayProps {
  progress: number;
  phase: 'uploading' | 'preparing' | 'sending';
  error?: string;
  onRetry: () => void;
  onCancel?: () => void;
  locale?: 'ar' | 'en';
}

export function SubmitOverlay({ progress, phase, error, onRetry, onCancel, locale = 'ar' }: SubmitOverlayProps) {
  const getPhaseText = () => {
    if (error) return '';
    if (progress <= 80) return 'جاري رفع الملفات...';
    if (progress <= 90) return 'جاري تجهيز الطلب...';
    return 'جاري إرسال الطلب...';
  };

  return (
    <div className="submit-overlay">
      <div className="submit-overlay__card">
        <div className="submit-overlay__progress-bar">
          <div
            className="submit-overlay__progress-fill"
            style={{ width: `${error ? progress : progress}%` }}
          />
        </div>

        {error ? (
          <>
            <p className="submit-overlay__error">{error}</p>
            <div className="submit-overlay__actions">
              <button type="button" className="submit-overlay__retry" onClick={onRetry}>
                {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </button>
              {onCancel && (
                <button type="button" className="submit-overlay__cancel" onClick={onCancel}>
                  {locale === 'ar' ? 'إلغاء الطلب' : 'Cancel order'}
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="submit-overlay__phase">{getPhaseText()}</p>
            <p className="submit-overlay__percent">{progress}%</p>
          </>
        )}
      </div>
    </div>
  );
}
