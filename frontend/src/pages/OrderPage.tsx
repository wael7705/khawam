import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from '../i18n';
import { workflowsAPI } from '../lib/api';
import { CATALOG_SERVICES } from '../lib/servicesCatalog';
import { OrderWizard } from '../components/order/OrderWizard';
import './OrderPage.css';

interface WorkflowStep {
  id: string;
  service_id: string;
  step_number: number;
  step_name_ar: string;
  step_name_en?: string;
  step_description_ar?: string;
  step_type: string;
  step_config: Record<string, any> | null;
  display_order: number;
  is_active: boolean;
}

export function OrderPage() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const { locale } = useTranslation();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const service = CATALOG_SERVICES.find((s) => s.slug === serviceSlug);

  useEffect(() => {
    if (!service) {
      setLoading(false);
      setError(locale === 'ar' ? 'الخدمة غير موجودة' : 'Service not found');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    workflowsAPI
      .getServiceWorkflow(service.id)
      .then((res) => {
        if (!cancelled) {
          const raw = (res.data as WorkflowStep[]) ?? [];
          const active = raw
            .filter((s) => s.is_active)
            .sort((a, b) => a.display_order - b.display_order);
          setSteps(active);
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
  }, [service, locale]);

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
        <OrderWizard service={service} steps={steps} />
      </div>
    </div>
  );
}
