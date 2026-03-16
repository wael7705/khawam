import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n/index';
import { dashboardApi, type PublicWork } from '../lib/dashboard-api';
import type { Work } from '../components/FeaturedWorks';
import './WorkDetailPage.css';

function normalizeWork(raw: PublicWork): Work {
  return {
    id: raw.id,
    title_ar: raw.title_ar ?? '',
    title: raw.title ?? '',
    description_ar: raw.description_ar ?? '',
    description: raw.description ?? '',
    image_url: raw.image_url ?? '',
    images: Array.isArray(raw.images) ? raw.images : [],
    category_ar: raw.category_ar ?? '',
    category: raw.category ?? '',
    is_featured: raw.is_featured ?? false,
  };
}

export function WorkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useTranslation();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const rows = await dashboardApi.getPublicWorks();
        const found = rows.find((w) => w.id === id);
        if (!cancelled && found) {
          const normalized = normalizeWork(found);
          setWork(normalized);
          setMainImage(normalized.image_url);
        } else if (!cancelled) {
          setWork(null);
        }
      } catch {
        if (!cancelled) setWork(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (work) setMainImage(work.image_url);
  }, [work]);

  const getTitle = () => (work ? (locale === 'ar' ? work.title_ar : work.title) : '');
  const getDescription = () => (work ? (locale === 'ar' ? work.description_ar : work.description) : '');
  const getCategory = () => (work ? (locale === 'ar' ? work.category_ar : work.category) : '');
  const allImages = work ? [...new Set([work.image_url, ...(work.images || [])].filter(Boolean))] : [];

  if (loading) {
    return (
      <section className="work-detail section">
        <div className="container">
          <p className="work-detail__state">{locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </section>
    );
  }

  if (!work) {
    return (
      <section className="work-detail section">
        <div className="container">
          <p className="work-detail__state">{locale === 'ar' ? 'العمل غير موجود' : 'Work not found'}</p>
          <Link to="/portfolio" className="btn btn-outline work-detail__back">
            {locale === 'ar' ? 'العودة للأعمال' : 'Back to portfolio'}
          </Link>
        </div>
      </section>
    );
  }

  const isRtl = locale === 'ar';

  return (
    <section className="work-detail section">
      <div className="container">
        <Link to="/portfolio" className="work-detail__back">
          {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          <span>{locale === 'ar' ? 'العودة للأعمال' : 'Back to portfolio'}</span>
        </Link>

        <div className="work-detail__main-image-wrap">
          <img src={mainImage} alt={getTitle()} className="work-detail__main-image" />
        </div>

        {allImages.length > 1 && (
          <div className="work-detail__thumbnails">
            {allImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`work-detail__thumb ${mainImage === src ? 'work-detail__thumb--active' : ''}`}
                onClick={() => setMainImage(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}

        {getCategory() && <span className="work-detail__category">{getCategory()}</span>}
        <h1 className="work-detail__title">{getTitle()}</h1>
        {getDescription() && <p className="work-detail__description">{getDescription()}</p>}
      </div>
    </section>
  );
}
