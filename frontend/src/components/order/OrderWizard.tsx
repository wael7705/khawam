import { useState, useCallback, useEffect } from 'react';
import {
  BookMarked,
  BookOpen,
  CreditCard,
  FileStack,
  FileText,
  FileUp,
  LayoutGrid,
  Palette,
  Printer,
  Ruler,
  Shirt,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { ordersAPI, type UploadedFileResult } from '../../lib/api';
import { isAllowedFile } from '../../lib/upload';
import { getServiceShortName } from '../../lib/servicesCatalog';
import { FileUploadStep } from './steps/FileUploadStep';
import { PrintOptionsStep } from './steps/PrintOptionsStep';
import { DimensionsStep } from './steps/DimensionsStep';
import { CardTypeStep } from './steps/CardTypeStep';
import { PaperTypeStep } from './steps/PaperTypeStep';
import { BindingOptionsStep } from './steps/BindingOptionsStep';
import { ThesisBindingStep } from './steps/ThesisBindingStep';
import { ClothingSourceStep } from './steps/ClothingSourceStep';
import { ClothingDesignsStep } from './steps/ClothingDesignsStep';
import { NotesStep } from './steps/NotesStep';
import { CustomerInfoStep } from './steps/CustomerInfoStep';
import { SubmitOverlay } from './SubmitOverlay';
import { OrderSuccess } from './OrderSuccess';
import './OrderWizard.css';

interface WorkflowStep {
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

const STEP_TYPE_ICONS: Record<string, LucideIcon> = {
  files: FileUp,
  print_options: Printer,
  notes: FileText,
  customer_info: User,
  dimensions: Ruler,
  binding_options: BookOpen,
  thesis_binding: BookMarked,
  card_type: CreditCard,
  paper_type: FileStack,
  clothing_source: Shirt,
  clothing_designs: Shirt,
};
function getStepIcon(stepType: string): LucideIcon | null {
  return STEP_TYPE_ICONS[stepType] ?? null;
}

interface ServiceInfo {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export interface OrderData {
  files: File[];
  uploadedFileResults: UploadedFileResult[];
  quantity: number;
  paper_size: string;
  print_color: 'bw' | 'color';
  print_quality: 'standard' | 'laser';
  print_sides: 'single' | 'double';
  booklet: boolean;
  width: number;
  height: number;
  paper_type: string;
  card_type: string;
  binding_type: string;
  cover_type: string;
  binding_color: string;
  text_color: string;
  cover_print_type: string;
  clothing_source: string;
  clothing_designs: Record<string, File | null>;
  needs_scale: boolean;
  scale_value: string;
  notes: string;
  customer_name: string;
  customer_whatsapp: string;
  customer_phone_extra: string;
  shop_name: string;
  delivery_type: 'self' | 'delivery';
  delivery_address: string;
  delivery_street: string;
  delivery_neighborhood: string;
  delivery_building_floor: string;
  delivery_extra: string;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_location_confirmed: boolean;
  /** عند اختيار موقع محفوظ: 'home'|'work'|'other'؛ عند التحديد من الخريطة: null */
  delivery_location_label: 'home' | 'work' | 'other' | null;
  number_of_pages: number;
  total_pages: number;
}

interface InitialDeliveryData {
  delivery_address?: string;
  delivery_street?: string;
  delivery_neighborhood?: string;
  delivery_building_floor?: string;
  delivery_extra?: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
}

export interface InitialCustomerData {
  customer_name?: string;
  customer_whatsapp?: string;
  customer_phone_extra?: string;
}

interface OrderWizardProps {
  service: ServiceInfo;
  /** معرّف الخدمة من القاعدة (لإرسال الطلب). إن كان null (وضع تجريبي) لا يُرسل الطلب. */
  backendServiceId: string | null;
  steps: WorkflowStep[];
  onClose?: () => void;
  useDemoMode?: boolean;
  initialDeliveryData?: InitialDeliveryData | null;
  /** بيانات العميل المعبأة مسبقاً عند تسجيل الدخول */
  initialCustomerData?: InitialCustomerData | null;
  /** معرّف المستخدم لربط الطلب بحسابه (يُرسل كـ customer_id) */
  customerId?: string | null;
}

const INITIAL_ORDER_DATA: OrderData = {
  files: [],
  uploadedFileResults: [],
  quantity: 1,
  paper_size: '',
  print_color: 'bw',
  print_quality: 'standard',
  print_sides: 'single',
  booklet: false,
  width: 0,
  height: 0,
  paper_type: '',
  card_type: '',
  binding_type: '',
  cover_type: '',
  binding_color: '',
  text_color: '',
  cover_print_type: '',
  clothing_source: '',
  clothing_designs: {},
  needs_scale: false,
  scale_value: '',
  notes: '',
  customer_name: '',
  customer_whatsapp: '',
  customer_phone_extra: '',
  shop_name: '',
  delivery_type: 'self',
  delivery_address: '',
  delivery_street: '',
  delivery_neighborhood: '',
  delivery_building_floor: '',
  delivery_extra: '',
  delivery_latitude: null,
  delivery_longitude: null,
  delivery_location_confirmed: false,
  delivery_location_label: null,
  number_of_pages: 0,
  total_pages: 0,
};

export function OrderWizard({
  service,
  backendServiceId,
  steps,
  onClose,
  useDemoMode,
  initialDeliveryData,
  initialCustomerData,
  customerId,
}: OrderWizardProps) {
  const { locale } = useTranslation();
  const initialMerged: OrderData = {
    ...INITIAL_ORDER_DATA,
    ...(initialCustomerData && {
      customer_name: initialCustomerData.customer_name ?? INITIAL_ORDER_DATA.customer_name,
      customer_whatsapp: initialCustomerData.customer_whatsapp ?? INITIAL_ORDER_DATA.customer_whatsapp,
      customer_phone_extra: initialCustomerData.customer_phone_extra ?? INITIAL_ORDER_DATA.customer_phone_extra,
    }),
  };
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData>(initialMerged);

  const deliveryMerge = useCallback(
    (prev: OrderData) => ({
      ...prev,
      delivery_address: initialDeliveryData!.delivery_address ?? prev.delivery_address,
      delivery_street: initialDeliveryData!.delivery_street ?? prev.delivery_street,
      delivery_neighborhood: initialDeliveryData!.delivery_neighborhood ?? prev.delivery_neighborhood,
      delivery_building_floor: initialDeliveryData!.delivery_building_floor ?? prev.delivery_building_floor,
      delivery_extra: initialDeliveryData!.delivery_extra ?? prev.delivery_extra,
      delivery_latitude: initialDeliveryData!.delivery_latitude ?? null,
      delivery_longitude: initialDeliveryData!.delivery_longitude ?? null,
      delivery_location_confirmed: true,
      delivery_location_label: null,
    }),
    [initialDeliveryData],
  );

  useEffect(() => {
    if (!initialDeliveryData || !service) return;
    const key = `orderWizard_${service.slug}`;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Omit<OrderData, 'files' | 'clothing_designs'> & { files?: unknown; clothing_designs?: unknown; currentStep?: number };
        const restored: OrderData = {
          ...parsed,
          files: [],
          clothing_designs: parsed.clothing_designs && typeof parsed.clothing_designs === 'object' ? {} : {},
          uploadedFileResults: Array.isArray(parsed.uploadedFileResults) ? parsed.uploadedFileResults as UploadedFileResult[] : [],
        };
        setOrderData(deliveryMerge(restored));
        const step = typeof parsed.currentStep === 'number' ? Math.min(Math.max(0, parsed.currentStep), steps.length - 1) : 0;
        setCurrentStep(step);
        sessionStorage.removeItem(key);
        return;
      }
    } catch {
      // ignore parse/storage errors
    }
    setOrderData((prev) => deliveryMerge(prev));
  }, [initialDeliveryData, service, deliveryMerge, steps.length]);

  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitPhase, setSubmitPhase] = useState<'uploading' | 'preparing' | 'sending'>('uploading');
  const [submitError, setSubmitError] = useState('');
  const [orderResult, setOrderResult] = useState<{ orderNumber: string } | null>(null);

  const updateData = useCallback(<K extends keyof OrderData>(key: K, value: OrderData[K]) => {
    setOrderData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const onBeforeNavigateToMap = useCallback(() => {
    try {
      const { files: _f, clothing_designs: _c, ...rest } = orderData;
      const snapshot = { ...rest, files: [], clothing_designs: {}, currentStep };
      sessionStorage.setItem(`orderWizard_${service.slug}`, JSON.stringify(snapshot));
    } catch {
      // ignore storage errors
    }
  }, [orderData, service.slug, currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (useDemoMode) {
      setOrderResult({ orderNumber: 'DEMO-' + Date.now() });
      return;
    }
    if (!backendServiceId) {
      setSubmitError(locale === 'ar' ? 'معرّف الخدمة غير متوفر.' : 'Service ID not available.');
      return;
    }
    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitPhase('uploading');
    setSubmitError('');

    try {
      const allFilesToUpload = [
        ...orderData.files,
        ...Object.values(orderData.clothing_designs).filter(Boolean),
      ] as File[];
      for (const file of allFilesToUpload) {
        const check = isAllowedFile(file);
        if (!check.ok) {
          setSubmitError(check.error);
          return;
        }
      }

      let uploaded = orderData.uploadedFileResults;

      if (orderData.files.length > 0 && uploaded.length === 0) {
        uploaded = await ordersAPI.uploadBatch(orderData.files, (pct) => {
          setSubmitProgress(Math.round(pct * 0.8));
        });
        setOrderData((prev) => ({ ...prev, uploadedFileResults: uploaded }));
      }

      setSubmitProgress(80);
      setSubmitPhase('preparing');

      const designFiles: File[] = [];
      for (const f of Object.values(orderData.clothing_designs)) {
        if (f) designFiles.push(f);
      }
      let designResults: UploadedFileResult[] = [];
      if (designFiles.length > 0) {
        designResults = await ordersAPI.uploadBatch(designFiles, (pct) => {
          setSubmitProgress(80 + Math.round(pct * 0.1));
        });
      }

      setSubmitProgress(90);
      setSubmitPhase('sending');

      const deliveryParts = [
        orderData.delivery_street,
        orderData.delivery_neighborhood,
        orderData.delivery_building_floor,
        orderData.delivery_extra,
      ].filter(Boolean) as string[];
      const delivery_address =
        deliveryParts.length > 0 ? deliveryParts.join('، ') : orderData.delivery_address;

      const productName = getServiceShortName(service.id, locale);
      const allFileUrls = [...uploaded.map((f) => f.url), ...designResults.map((d) => d.url)];
      const specifications: Record<string, unknown> = {
        service_id: backendServiceId,
        quantity: orderData.quantity,
        paper_size: orderData.paper_size,
        print_color: orderData.print_color,
        print_quality: orderData.print_quality,
        print_sides: orderData.print_sides,
        booklet: orderData.booklet,
        width: orderData.width,
        height: orderData.height,
        paper_type: orderData.paper_type,
        card_type: orderData.card_type,
        binding_type: orderData.binding_type,
        cover_type: orderData.cover_type,
        binding_color: orderData.binding_color,
        text_color: orderData.text_color,
        cover_print_type: orderData.cover_print_type,
        clothing_source: orderData.clothing_source,
        clothing_designs: designResults.map((d) => d.url),
        needs_scale: orderData.needs_scale,
        scale_value: orderData.scale_value,
        notes: orderData.notes,
        number_of_pages: orderData.number_of_pages,
        total_pages: orderData.total_pages,
      };

      const payload: Record<string, unknown> = {
        service_id: backendServiceId,
        ...(customerId && { customer_id: customerId }),
        customer_name: orderData.customer_name || undefined,
        customer_whatsapp: orderData.customer_whatsapp || undefined,
        customer_phone: orderData.customer_phone_extra || orderData.customer_whatsapp || undefined,
        shop_name: orderData.shop_name || undefined,
        delivery_type: orderData.delivery_type,
        delivery_address: delivery_address || undefined,
        delivery_street: orderData.delivery_street || undefined,
        delivery_neighborhood: orderData.delivery_neighborhood || undefined,
        delivery_building_floor: orderData.delivery_building_floor || undefined,
        delivery_extra: orderData.delivery_extra || undefined,
        delivery_latitude: orderData.delivery_latitude ?? undefined,
        delivery_longitude: orderData.delivery_longitude ?? undefined,
        total_amount: 0,
        final_amount: 0,
        items: [
          {
            product_name: productName,
            quantity: 1,
            unit_price: 0,
            specifications,
            design_files: allFileUrls,
          },
        ],
      };

      const res = await ordersAPI.create(payload);
      setSubmitProgress(100);

      const data = res.data as { id: string; order_number: string };
      setOrderResult({ orderNumber: data.order_number });
    } catch (err: unknown) {
      const progress = submitProgress;
      if (progress < 80) {
        setSubmitError(locale === 'ar' ? 'فشل رفع الملفات' : 'File upload failed');
      } else {
        setSubmitError(locale === 'ar' ? 'فشل في إرسال الطلب' : 'Failed to submit order');
      }
      void err;
    }
  }, [orderData, service.id, backendServiceId, locale, submitProgress, useDemoMode, customerId]);

  if (orderResult) {
    return <OrderSuccess orderNumber={orderResult.orderNumber} onClose={onClose} />;
  }

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  return (
    <div className="order-wizard">
      {/* Step Indicator */}
      <div className="wizard-steps">
        {steps.map((s, i) => {
          const StepIcon = getStepIcon(s.step_type);
          return (
            <div key={s.id} className="wizard-steps__item">
              <div
                className={`wizard-steps__circle${
                  i < currentStep
                    ? ' wizard-steps__circle--completed'
                    : i === currentStep
                      ? ' wizard-steps__circle--active'
                      : ''
                }`}
              >
                {i < currentStep ? (
                  '✓'
                ) : StepIcon ? (
                  <StepIcon size={18} className="wizard-steps__icon" aria-hidden />
                ) : (
                  i + 1
                )}
              </div>
              <span className="wizard-steps__label">
                {locale === 'ar' ? s.step_name_ar : (s.step_name_en || s.step_name_ar)}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`wizard-steps__line${
                    i < currentStep ? ' wizard-steps__line--completed' : ''
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {step && (() => {
        const StepTitleIcon = getStepIcon(step.step_type);
        return (
        <div className="wizard-card" key={step.id}>
          <h2 className="wizard-card__title">
            {StepTitleIcon && (
              <StepTitleIcon size={22} className="wizard-card__title-icon" aria-hidden />
            )}
            {locale === 'ar' ? step.step_name_ar : (step.step_name_en || step.step_name_ar)}
          </h2>
          {(locale === 'ar'
            ? (step.step_description_ar || step.step_description_en)
            : (step.step_description_en || step.step_description_ar)) && (
            <p className="wizard-card__desc">
              {locale === 'ar'
                ? (step.step_description_ar || step.step_description_en || '')
                : (step.step_description_en || step.step_description_ar || '')}
            </p>
          )}

          {renderStep(step, orderData, updateData, locale, service, onBeforeNavigateToMap)}
        </div>
        );
      })()}

      {/* Navigation */}
      <div className="wizard-nav">
        <button
          className="wizard-nav__btn wizard-nav__btn--secondary"
          onClick={handleBack}
          disabled={currentStep === 0}
          type="button"
        >
          {locale === 'ar' ? 'السابق' : 'Back'}
        </button>

        {isLastStep ? (
          <button
            className="wizard-nav__btn wizard-nav__btn--primary"
            onClick={handleSubmit}
            type="button"
          >
            {locale === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
          </button>
        ) : (
          <button
            className="wizard-nav__btn wizard-nav__btn--primary"
            onClick={handleNext}
            type="button"
          >
            {locale === 'ar' ? 'التالي' : 'Next'}
          </button>
        )}
      </div>

      {submitting && !orderResult && (
        <SubmitOverlay
          progress={submitProgress}
          phase={submitPhase}
          error={submitError}
          onRetry={handleSubmit}
          onCancel={() => {
            setSubmitting(false);
            setSubmitError('');
            onClose?.();
          }}
          locale={locale}
        />
      )}
    </div>
  );
}

function renderStep(
  step: WorkflowStep,
  orderData: OrderData,
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void,
  locale: 'ar' | 'en',
  service: ServiceInfo,
  onBeforeNavigateToMap?: () => void,
) {
  const config = step.step_config || {};

  switch (step.step_type) {
    case 'files':
      return (
        <FileUploadStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'print_options':
      return (
        <PrintOptionsStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'dimensions':
      return (
        <DimensionsStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'card_type':
      return (
        <CardTypeStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'paper_type':
      return (
        <PaperTypeStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'binding_options':
      return (
        <BindingOptionsStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'thesis_binding':
      return (
        <ThesisBindingStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'clothing_source':
      return (
        <ClothingSourceStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'clothing_designs':
      return (
        <ClothingDesignsStep
          orderData={orderData}
          updateData={updateData}
          stepConfig={config}
          locale={locale}
        />
      );
    case 'notes':
      return (
        <NotesStep
          orderData={orderData}
          updateData={updateData}
          locale={locale}
        />
      );
    case 'customer_info':
      return (
        <CustomerInfoStep
          orderData={orderData}
          updateData={updateData}
          locale={locale}
          serviceSlug={service.slug}
          onBeforeNavigateToMap={onBeforeNavigateToMap}
        />
      );
    default:
      return (
        <p style={{ color: 'var(--text-light)' }}>
          {locale === 'ar' ? 'نوع خطوة غير معروف' : 'Unknown step type'}: {step.step_type}
        </p>
      );
  }
}
