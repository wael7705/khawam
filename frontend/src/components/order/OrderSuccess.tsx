import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';

interface OrderSuccessProps {
  orderNumber: string;
  onClose?: () => void;
}

export function OrderSuccess({ orderNumber, onClose }: OrderSuccessProps) {
  const navigate = useNavigate();
  const { locale } = useTranslation();

  const handleOk = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  return (
    <div className="order-success">
      <div className="order-success__check">
        <svg
          className="order-success__check-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline
            points="20 6 9 17 4 12"
            style={{ strokeDasharray: 50, strokeDashoffset: 0 }}
          />
        </svg>
      </div>

      <h2 className="order-success__title">
        {locale === 'ar' ? 'تم إرسال طلبك بنجاح!' : 'Order submitted successfully!'}
      </h2>

      <p className="order-success__number">#{orderNumber}</p>

      <div className="order-success__actions">
        <button
          type="button"
          className="order-success__btn order-success__btn--primary"
          onClick={handleOk}
        >
          {locale === 'ar' ? 'حسناً' : 'OK'}
        </button>
        <button
          type="button"
          className="order-success__btn order-success__btn--outline"
          onClick={() => navigate('/my-orders', { state: { openOrderNumber: orderNumber } })}
        >
          {locale === 'ar' ? 'متابعة الطلب' : 'Track Order'}
        </button>
      </div>
    </div>
  );
}
