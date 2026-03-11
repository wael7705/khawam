interface SubmitOverlayProps {
  progress: number;
  phase: 'uploading' | 'preparing' | 'sending';
  error?: string;
  onRetry: () => void;
}

export function SubmitOverlay({ progress, phase, error, onRetry }: SubmitOverlayProps) {
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
            <button type="button" className="submit-overlay__retry" onClick={onRetry}>
              إعادة المحاولة
            </button>
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
