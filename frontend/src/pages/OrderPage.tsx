import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import { workflowsAPI } from '../lib/api';
import { CATALOG_SERVICES } from '../lib/servicesCatalog';
import { getStoredUser } from '../lib/auth';
import { OrderWizard } from '../components/order/OrderWizard';
import type { WorkflowStep } from '../components/order/OrderModal';
import './OrderPage.css';

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

export function OrderPage() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { locale } = useTranslation();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [backendServiceId, setBackendServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const service = CATALOG_SERVICES.find((s) => s.slug === serviceSlug);
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
      if (!service) setError(locale === 'ar' ? 'الخدمة غير موجودة' : 'Service not found');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setBackendServiceId(null);

    workflowsAPI
      .getWorkflowBySlug(serviceSlug)
      .then((res) => {
        if (!cancelled) {
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
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg =
            err && typeof err === 'object' && 'response' in err
              ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
              : null;
          const fallback =
            locale === 'ar' ? 'حدث خطأ في تحميل خطوات الطلب' : 'Failed to load order steps';
          setError(typeof msg === 'string' ? msg : fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [service, serviceSlug, locale]);

  if (loading) {
    return (
      <div className="order-page">
        <div className="order-page__loading">
          <div className="order-page__spinner" />
          <p>{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="order-page">
        <div className="order-page__error">
          <div className="order-page__error-icon">!</div>
          <h2>{error || (locale === 'ar' ? 'الخدمة غير موجودة' : 'Service not found')}</h2>
          <Link to="/services" className="btn btn-primary">
            {locale === 'ar' ? 'العودة للخدمات' : 'Back to Services'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="order-page">
      <div className="container">
        <header className="order-page__header">
          <Link to="/services" className="order-page__back">
            {locale === 'ar' ? '→ العودة للخدمات' : '← Back to Services'}
          </Link>
          <h1>{locale === 'ar' ? service.nameAr : service.nameEn}</h1>
          <p>{locale === 'ar' ? service.descriptionAr : service.descriptionEn}</p>
        </header>
        <OrderWizard
          service={service}
          backendServiceId={backendServiceId}
          steps={steps}
          initialCustomerData={initialCustomerData}
          customerId={customerId}
        />
      </div>
    </div>
  );
}
