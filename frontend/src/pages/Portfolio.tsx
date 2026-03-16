import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi, type PublicWork } from '../lib/dashboard-api';
import { useTranslation } from '../i18n';
import type { Work } from '../components/FeaturedWorks';
import './Portfolio.css';

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

export function Portfolio() {
  const { locale } = useTranslation();
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const rows = await dashboardApi.getPublicWorks();
        setWorks(rows.map(normalizeWork));
      } catch {
        setWorks([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filteredWorks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return works;
    return works.filter((work) => {
      return (
        (work.title_ar ?? '').toLowerCase().includes(q) ||
        (work.title ?? '').toLowerCase().includes(q) ||
        (work.category_ar ?? '').toLowerCase().includes(q) ||
        (work.category ?? '').toLowerCase().includes(q)
      );
    });
  }, [search, works]);

  return (
    <section className="portfolio-page section">
      <div className="container">
        <header className="portfolio-page__head">
          <h1>{locale === 'ar' ? 'أعمالنا' : 'Our Works'}</h1>
          <p>{locale === 'ar' ? 'منتجاتنا وأعمالنا المتميزة' : 'Browse our featured and latest projects'}</p>
        </header>

        <div className="portfolio-page__search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث عن عمل...' : 'Search work...'}
          />
        </div>

        {loading ? (
          <div className="portfolio-page__state">{locale === 'ar' ? 'جاري تحميل الأعمال...' : 'Loading works...'}</div>
        ) : filteredWorks.length === 0 ? (
          <div className="portfolio-page__state">{locale === 'ar' ? 'لا توجد أعمال مطابقة' : 'No matching works'}</div>
        ) : (
          <div className="portfolio-grid">
            {filteredWorks.map((work) => (
              <button key={work.id} type="button" className="portfolio-card" onClick={() => navigate(`/portfolio/work/${work.id}`)}>
                <div className="portfolio-card__image-wrap">
                  <img src={work.image_url} alt={locale === 'ar' ? work.title_ar : work.title} className="portfolio-card__image" />
                  {work.is_featured ? (
                    <span className="portfolio-card__featured">{locale === 'ar' ? 'مميز' : 'Featured'}</span>
                  ) : null}
                </div>
                <div className="portfolio-card__content">
                  <span>{locale === 'ar' ? work.category_ar : work.category}</span>
                  <h3>{locale === 'ar' ? work.title_ar : work.title}</h3>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
