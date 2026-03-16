import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Plus, Star, Trash2, Upload } from 'lucide-react';
import { dashboardApi, type ManagedWork, type ManagedWorkPayload } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './WorksManagement.css';

type UploadPhase = 'idle' | 'uploading' | 'processing' | 'done';

interface WorkFormState {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  category_ar: string;
  image_url: string;
  subImages: string[];
  is_featured: boolean;
}

const initialForm: WorkFormState = {
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  category: '',
  category_ar: '',
  image_url: '',
  subImages: [],
  is_featured: false,
};

export function WorksManagement() {
  const { locale } = useTranslation();
  const [works, setWorks] = useState<ManagedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<WorkFormState>(initialForm);
  const [uploadPhaseMain, setUploadPhaseMain] = useState<UploadPhase>('idle');
  const [uploadPhaseSub, setUploadPhaseSub] = useState<UploadPhase>('idle');
  const [subUploadProgress, setSubUploadProgress] = useState<{ total: number; current: number }>({ total: 0, current: 0 });
  const [createError, setCreateError] = useState<string | null>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const subImagesInputRef = useRef<HTMLInputElement>(null);

  const labels = useMemo(
    () =>
      locale === 'ar'
        ? {
            title: 'إدارة الأعمال',
            subtitle: 'إضافة الأعمال وتصنيفها كمميزة أو عادية.',
            create: 'إضافة عمل جديد',
            loading: 'تحميل الأعمال...',
            empty: 'لا توجد أعمال حالياً',
            mainImage: 'الصورة الرئيسية',
            uploadMain: 'رفع صورة رئيسية',
            subImages: 'الصور الفرعية',
            uploadSub: 'رفع صور فرعية',
            phaseUploading: 'جاري الرفع',
            phaseProcessing: 'جاري المعالجة',
            phaseDone: 'تم',
            featured: 'عمل مميز',
            openCreate: 'إنشاء عمل جديد',
            save: 'حفظ العمل',
            delete: 'حذف',
            hide: 'إخفاء',
            show: 'إظهار',
            close: 'إغلاق',
          }
        : {
            title: 'Works Management',
            subtitle: 'Create works and control featured visibility.',
            create: 'Create Work',
            loading: 'Loading works...',
            empty: 'No works found',
            mainImage: 'Main image',
            uploadMain: 'Upload main image',
            subImages: 'Sub images',
            uploadSub: 'Upload sub images',
            phaseUploading: 'Uploading',
            phaseProcessing: 'Processing',
            phaseDone: 'Done',
            featured: 'Featured work',
            openCreate: 'Create new work',
            save: 'Save work',
            delete: 'Delete',
            hide: 'Hide',
            show: 'Show',
            close: 'Close',
          },
    [locale],
  );

  const loadWorks = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.getManagedWorks();
      setWorks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWorks();
  }, []);

  const handleCreate = async () => {
    setCreateError(null);
    if (!form.title.trim() || !form.title_ar.trim() || !form.image_url.trim()) {
      setCreateError(locale === 'ar' ? 'العنوان (عربي وإنجليزي) والصورة الرئيسية مطلوبة.' : 'Title (AR & EN) and main image are required.');
      return;
    }
    try {
      const payload: ManagedWorkPayload = {
        title: form.title.trim(),
        title_ar: form.title_ar.trim(),
        description: form.description.trim() || undefined,
        description_ar: form.description_ar.trim() || undefined,
        category: form.category.trim() || undefined,
        category_ar: form.category_ar.trim() || undefined,
        image_url: form.image_url.trim(),
        images: form.subImages,
        is_featured: form.is_featured,
        is_visible: true,
      };
      await dashboardApi.createManagedWork(payload);
      setForm(initialForm);
      setCreateOpen(false);
      await loadWorks();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setCreateError(typeof msg === 'string' ? msg : (locale === 'ar' ? 'فشل إنشاء العمل. تحقق من الاتصال بالخادم.' : 'Failed to create work. Check server connection.'));
    }
  };

  const toggleFeatured = async (work: ManagedWork) => {
    await dashboardApi.updateManagedWork(work.id, { is_featured: !work.is_featured });
    await loadWorks();
  };

  const toggleVisible = async (work: ManagedWork) => {
    await dashboardApi.updateManagedWork(work.id, { is_visible: !work.is_visible });
    await loadWorks();
  };

  const removeWork = async (work: ManagedWork) => {
    await dashboardApi.deleteManagedWork(work.id);
    await loadWorks();
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadPhaseMain('uploading');
    try {
      setUploadPhaseMain('processing');
      const { url } = await dashboardApi.uploadAdminFile(file, 'general');
      setForm((p) => ({ ...p, image_url: url }));
      setUploadPhaseMain('done');
      setTimeout(() => setUploadPhaseMain('idle'), 1200);
    } catch {
      setUploadPhaseMain('idle');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const total = files.length;
    setSubUploadProgress({ total, current: 0 });
    setUploadPhaseSub('uploading');
    try {
      setUploadPhaseSub('processing');
      const { urls } = await dashboardApi.uploadAdminMultiple(Array.from(files), 'general');
      setSubUploadProgress((p) => ({ ...p, current: p.total }));
      setForm((p) => ({ ...p, subImages: [...p.subImages, ...(urls ?? [])] }));
      setUploadPhaseSub('done');
      setTimeout(() => {
        setUploadPhaseSub('idle');
        setSubUploadProgress({ total: 0, current: 0 });
      }, 1200);
    } catch {
      setUploadPhaseSub('idle');
      setSubUploadProgress({ total: 0, current: 0 });
    } finally {
      e.target.value = '';
    }
  };

  const mainUploadLabel =
    uploadPhaseMain === 'uploading'
      ? labels.phaseUploading
      : uploadPhaseMain === 'processing'
        ? labels.phaseProcessing
        : uploadPhaseMain === 'done'
          ? labels.phaseDone
          : labels.uploadMain;
  const subUploadLabel =
    uploadPhaseSub === 'uploading'
      ? labels.phaseUploading
      : uploadPhaseSub === 'processing'
        ? labels.phaseProcessing
        : uploadPhaseSub === 'done'
          ? labels.phaseDone
          : labels.uploadSub;
  const mainUploadTitle = [labels.phaseUploading, labels.phaseProcessing, labels.phaseDone].join(' → ');
  const subUploadTitle =
    uploadPhaseSub !== 'idle'
      ? (locale === 'ar'
          ? `جاري رفع ${subUploadProgress.current} من ${subUploadProgress.total} صورة`
          : `Uploading ${subUploadProgress.current} of ${subUploadProgress.total} images`)
      : [labels.phaseUploading, labels.phaseProcessing, labels.phaseDone].join(' → ');
  const subUploadPct =
    subUploadProgress.total > 0
      ? Math.round((subUploadProgress.current / subUploadProgress.total) * 100)
      : 0;

  return (
    <div className="works-page">
      <header className="works-page__head">
        <h1>{labels.title}</h1>
        <p>{labels.subtitle}</p>
        <button type="button" className="works-btn works-btn--primary" onClick={() => setCreateOpen(true)}>
          <Plus size={14} />
          {labels.openCreate}
        </button>
      </header>

      {createOpen && (
        <div className="works-modal" onClick={() => setCreateOpen(false)}>
          <section className="works-create" onClick={(e) => e.stopPropagation()}>
            <div className="works-create__head">
              <h3>{labels.create}</h3>
              <button type="button" className="works-btn" onClick={() => { setCreateOpen(false); setCreateError(null); }}>
                {labels.close}
              </button>
            </div>
            {createError && (
              <div className="works-create__error" role="alert">
                {createError}
              </div>
            )}
            <div className="works-create__grid">
              <input value={form.title_ar} onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان (AR)" />
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title (EN)" />
              <input value={form.category_ar} onChange={(e) => setForm((p) => ({ ...p, category_ar: e.target.value }))} placeholder="التصنيف (AR)" />
              <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category (EN)" />
              <div className="works-create__field-row works-create__upload-row" title={mainUploadTitle}>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  className="works-create__hidden-input"
                  aria-hidden
                  onChange={handleMainImageUpload}
                />
                <button
                  type="button"
                  className="works-btn works-btn--secondary"
                  disabled={uploadPhaseMain !== 'idle' && uploadPhaseMain !== 'done'}
                  onClick={() => mainImageInputRef.current?.click()}
                  title={mainUploadTitle}
                  aria-label={mainUploadLabel}
                >
                  <Upload size={14} />
                  {mainUploadLabel}
                </button>
                {uploadPhaseMain !== 'idle' && (
                  <span className="works-create__upload-phase" aria-live="polite">
                    {uploadPhaseMain === 'uploading' && labels.phaseUploading}
                    {uploadPhaseMain === 'processing' && labels.phaseProcessing}
                    {uploadPhaseMain === 'done' && labels.phaseDone}
                  </span>
                )}
              </div>
              <label className="works-create__check">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                />
                {labels.featured}
              </label>
              <textarea
                value={form.description_ar}
                onChange={(e) => setForm((p) => ({ ...p, description_ar: e.target.value }))}
                placeholder="الوصف (AR)"
              />
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Description (EN)" />
              <div className="works-create__sub-images-wrap works-create__upload-row" title={subUploadTitle}>
                {form.subImages.length > 0 && (
                  <span className="works-create__sub-count">
                    {labels.subImages}: {form.subImages.length}
                  </span>
                )}
                <input
                  ref={subImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="works-create__hidden-input"
                  aria-hidden
                  onChange={handleSubImagesUpload}
                />
                <button
                  type="button"
                  className="works-btn works-btn--secondary"
                  disabled={uploadPhaseSub !== 'idle' && uploadPhaseSub !== 'done'}
                  onClick={() => subImagesInputRef.current?.click()}
                  title={subUploadTitle}
                  aria-label={subUploadLabel}
                >
                  <Upload size={14} />
                  {subUploadLabel}
                </button>
                {uploadPhaseSub !== 'idle' && (
                  <span className="works-create__upload-phase" aria-live="polite">
                    {uploadPhaseSub === 'uploading' && labels.phaseUploading}
                    {uploadPhaseSub === 'processing' && labels.phaseProcessing}
                    {uploadPhaseSub === 'done' && labels.phaseDone}
                    {subUploadProgress.total > 0 && ` (${subUploadPct}%)`}
                  </span>
                )}
                {uploadPhaseSub !== 'idle' && subUploadProgress.total > 0 && (
                  <div className="works-create__progress-wrap" title={subUploadTitle}>
                    <div
                      className="works-create__progress-bar"
                      style={{ width: `${subUploadPct}%` }}
                      role="progressbar"
                      aria-valuenow={subUploadPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                )}
              </div>
            </div>
            <button type="button" className="works-btn works-btn--primary" onClick={() => void handleCreate()}>
              <Plus size={14} />
              {labels.save}
            </button>
          </section>
        </div>
      )}

      {loading ? (
        <div className="works-state">{labels.loading}</div>
      ) : works.length === 0 ? (
        <div className="works-state">{labels.empty}</div>
      ) : (
        <section className="works-grid">
          {works.map((work) => (
            <article key={work.id} className="works-card">
              <img src={work.image_url} alt={locale === 'ar' ? work.title_ar : work.title} />
              <div className="works-card__content">
                <h4>{locale === 'ar' ? work.title_ar : work.title}</h4>
                <p>{locale === 'ar' ? (work.description_ar ?? '') : (work.description ?? work.description_ar ?? '')}</p>
                <div className="works-card__actions">
                  <button type="button" className="works-btn" onClick={() => void toggleFeatured(work)}>
                    <Star size={14} />
                    {work.is_featured ? '★' : '☆'}
                  </button>
                  <button type="button" className="works-btn" onClick={() => void toggleVisible(work)}>
                    {work.is_visible ? <EyeOff size={14} /> : <Eye size={14} />}
                    {work.is_visible ? labels.hide : labels.show}
                  </button>
                  <button type="button" className="works-btn works-btn--danger" onClick={() => void removeWork(work)}>
                    <Trash2 size={14} />
                    {labels.delete}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
