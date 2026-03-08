import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Plus, Star, Trash2 } from 'lucide-react';
import { dashboardApi, type ManagedWork, type ManagedWorkPayload } from '../../lib/dashboard-api';
import { useTranslation } from '../../i18n';
import './WorksManagement.css';

interface WorkFormState {
  title: string;
  title_ar: string;
  description: string;
  description_ar: string;
  category: string;
  category_ar: string;
  image_url: string;
  images_raw: string;
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
  images_raw: '',
  is_featured: false,
};

export function WorksManagement() {
  const { locale } = useTranslation();
  const [works, setWorks] = useState<ManagedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<WorkFormState>(initialForm);

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
            subImages: 'الصور الفرعية (رابط بكل سطر)',
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
            subImages: 'Sub images (one URL per line)',
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
    if (!form.title.trim() || !form.title_ar.trim() || !form.image_url.trim()) return;
    const payload: ManagedWorkPayload = {
      title: form.title.trim(),
      title_ar: form.title_ar.trim(),
      description: form.description.trim() || undefined,
      description_ar: form.description_ar.trim() || undefined,
      category: form.category.trim() || undefined,
      category_ar: form.category_ar.trim() || undefined,
      image_url: form.image_url.trim(),
      images: form.images_raw
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      is_featured: form.is_featured,
      is_visible: true,
    };
    await dashboardApi.createManagedWork(payload);
    setForm(initialForm);
    setCreateOpen(false);
    await loadWorks();
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
              <button type="button" className="works-btn" onClick={() => setCreateOpen(false)}>
                {labels.close}
              </button>
            </div>
            <div className="works-create__grid">
              <input value={form.title_ar} onChange={(e) => setForm((p) => ({ ...p, title_ar: e.target.value }))} placeholder="العنوان (AR)" />
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title (EN)" />
              <input value={form.category_ar} onChange={(e) => setForm((p) => ({ ...p, category_ar: e.target.value }))} placeholder="التصنيف (AR)" />
              <input value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category (EN)" />
              <input
                value={form.image_url}
                onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))}
                placeholder={labels.mainImage}
              />
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
              <textarea
                className="works-create__sub-images"
                value={form.images_raw}
                onChange={(e) => setForm((p) => ({ ...p, images_raw: e.target.value }))}
                placeholder={labels.subImages}
              />
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
