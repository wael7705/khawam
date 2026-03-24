import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { workflowsAPI } from '../../lib/api';
import { CATALOG_SERVICES } from '../../lib/servicesCatalog';
import { getStoredUser } from '../../lib/auth';
import { OrderWizard } from './OrderWizard';
import './OrderModal.css';

export interface WorkflowStep {
  id: string;
  service_id: string;
  step_number: number;
  step_name_ar: string;
  step_name_en?: string;
  step_description_ar?: string;
  step_description_en?: string;
  step_type: string;
  step_config: Record<string, unknown> | null;
  display_order: number;
  is_active: boolean;
}

function getMockWorkflowSteps(serviceId: string): WorkflowStep[] {
  const steps: Omit<WorkflowStep, 'id' | 'service_id'>[] = [
    {
      step_number: 1,
      step_name_ar: 'رفع الملفات',
      step_name_en: 'Upload Files',
      step_description_ar: 'ارفع ملفات المحاضرات (PDF أو Word)',
      step_type: 'files',
      step_config: {
        accept: '.pdf,.doc,.docx',
        multiple: true,
        required: true,
        show_quantity: true,
        max_size_mb: 50,
      },
      display_order: 0,
      is_active: true,
    },
    {
      step_number: 2,
      step_name_ar: 'خيارات الطباعة',
      step_name_en: 'Print Options',
      step_description_ar: 'اختر حجم الورق ونوع الطباعة',
      step_type: 'print_options',
      step_config: {
        paper_sizes: ['A3', 'A4', 'A5', 'B5'],
        show_booklet: true,
        show_color: true,
        show_quality: true,
        show_sides: true,
      },
      display_order: 1,
      is_active: true,
    },
    {
      step_number: 3,
      step_name_ar: 'ملاحظات',
      step_name_en: 'Notes',
      step_type: 'notes',
      step_config: {},
      display_order: 2,
      is_active: true,
    },
    {
      step_number: 4,
      step_name_ar: 'بيانات العميل والتوصيل',
      step_name_en: 'Customer Info & Delivery',
      step_description_ar: 'أدخل بياناتك واختر طريقة الاستلام',
      step_type: 'customer_info',
      step_config: { fields: ['name', 'whatsapp'], delivery: true },
      display_order: 3,
      is_active: true,
    },
  ];
  return steps.map((s, i) => ({
    ...s,
    id: `mock-step-${serviceId}-${i}`,
    service_id: serviceId,
  }));
}

export interface DeliveryResult {
  delivery_address?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}

interface OrderModalProps {
  serviceSlug: string | null;
  onClose: () => void;
  initialDeliveryData?: DeliveryResult | null;
  onSwitchServiceSlug?: (slug: string) => void;
}

function mapBackendStepToWorkflowStep(
  s: {
    id: string;
    serviceId: string;
    stepNumber: number;
    stepNameAr: string;
    stepNameEn?: string | null;
    stepDescriptionAr?: string | null;
    stepDescriptionEn?: string | null;
    stepType: string;
    stepConfig?: Record<string, unknown> | null;
    displayOrder: number;
    isActive: boolean;
  },
): WorkflowStep {
  return {
    id: s.id,
    service_id: s.serviceId,
    step_number: s.stepNumber,
    step_name_ar: s.stepNameAr,
    step_name_en: s.stepNameEn ?? undefined,
    step_description_ar: s.stepDescriptionAr ?? undefined,
    step_description_en: s.stepDescriptionEn ?? undefined,
    step_type: s.stepType,
    step_config: s.stepConfig ?? null,
    display_order: s.displayOrder,
    is_active: s.isActive,
  };
}

export function OrderModal({ serviceSlug, onClose, initialDeliveryData, onSwitchServiceSlug }: OrderModalProps) {
  const { locale } = useTranslation();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [backendServiceId, setBackendServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [useDemo, setUseDemo] = useState(false);

  const service = serviceSlug ? CATALOG_SERVICES.find((s) => s.slug === serviceSlug) : null;
  const user = getStoredUser();
  const initialCustomerData =
    user != null
      ? {
          customer_name: user.name,
          customer_whatsapp: user.phone ?? '',
          customer_phone_extra: '',
        }
      : undefined;
  const customerId = user?.id ?? undefined;

  useEffect(() => {
    if (!service || !serviceSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setIsConnectionError(false);
    setUseDemo(false);
    setBackendServiceId(null);

    let cancelled = false;

    workflowsAPI
      .getWorkflowBySlug(serviceSlug)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        const raw = (data?.steps ?? []).map(mapBackendStepToWorkflowStep);
        const active = raw
          .filter((s) => s.is_active !== false)
          .sort((a, b) => (a.display_order ?? a.step_number) - (b.display_order ?? b.step_number));
        setSteps(active);
        if (data?.serviceId) setBackendServiceId(data.serviceId);
        if (active.length === 0) {
          setError(
            locale === 'ar'
              ? 'لم يتم العثور على خطوات لهذه الخدمة. تحقق من إعداد الـ workflow في الخادم.'
              : 'No workflow steps found for this service. Check workflow setup on the server.',
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const isRefused =
          err &&
          typeof err === 'object' &&
          ('message' in err && String((err as { message?: string }).message).toLowerCase().includes('network'));
        const isConnRefused = (err as { code?: string }).code === 'ERR_NETWORK' || isRefused;
        setIsConnectionError(Boolean(isConnRefused));
        setError(
          isConnRefused
            ? (locale === 'ar'
                ? 'تعذر الاتصال بالخادم. تأكد من تشغيل السيرفر (المنفذ 8000).'
                : 'Could not connect to server. Make sure the backend is running (port 8000).')
            : locale === 'ar'
              ? 'حدث خطأ في تحميل خطوات الطلب'
              : 'Failed to load order steps',
        );
        setSteps([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, serviceSlug, locale]);

  const loadDemo = () => {
    if (!service) return;
    setSteps(getMockWorkflowSteps(service.id));
    setError('');
    setIsConnectionError(false);
    setUseDemo(true);
  };

  if (!serviceSlug || !service) return null;

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <header className="order-modal__header">
          <h2>{locale === 'ar' ? service.nameAr : service.nameEn}</h2>
          <button type="button" className="order-modal__close" onClick={onClose} aria-label={locale === 'ar' ? 'إغلاق' : 'Close'}>
            <X size={22} />
          </button>
        </header>

        <div className="order-modal__body">
          {loading && (
            <div className="order-modal__loading">
              <div className="order-page__spinner" />
              <p>{locale === 'ar' ? 'جاري تحميل خطوات الطلب...' : 'Loading order steps...'}</p>
            </div>
          )}

          {!loading && error && steps.length === 0 && (
            <div className="order-modal__error">
              <div className="order-page__error-icon">!</div>
              <p className="order-modal__error-text">{error}</p>
              {isConnectionError && (
                <button type="button" className="order-modal__demo-btn" onClick={loadDemo}>
                  {locale === 'ar' ? 'عرض تجريبي للخطوات' : 'Show demo steps'}
                </button>
              )}
              <button type="button" className="btn btn-primary order-modal__dismiss" onClick={onClose}>
                {locale === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          )}

          {!loading && steps.length > 0 && (
            <>
              {useDemo && (
                <p className="order-modal__demo-badge">
                  {locale === 'ar' ? 'وضع تجريبي — الإرسال غير متاح' : 'Demo mode — submit disabled'}
                </p>
              )}
              <OrderWizard
                key={service.slug}
                service={service}
                backendServiceId={useDemo ? null : backendServiceId}
                steps={steps}
                onClose={onClose}
                useDemoMode={useDemo}
                initialDeliveryData={initialDeliveryData}
                initialCustomerData={initialCustomerData}
                customerId={customerId}
                onSwitchServiceSlug={onSwitchServiceSlug}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
