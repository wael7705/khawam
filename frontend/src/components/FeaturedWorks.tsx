import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { dashboardApi, type PublicWork } from '../lib/dashboard-api';
import './FeaturedWorks.css';

export interface Work {
  id: string;
  title_ar: string;
  title: string;
  description_ar: string;
  description: string;
  image_url: string;
  images: string[];
  category_ar: string;
  category: string;
  is_featured?: boolean;
}

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

export function FeaturedWorks() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);

  useEffect(() => {
    dashboardApi
      .getPublicWorks()
      .then((rows) => {
        setWorks(rows.filter((work) => work.is_featured).slice(0, 12).map(normalizeWork));
      })
      .catch(() => setWorks([]));
  }, []);

  const getTitle = (work: Work) => (locale === 'ar' ? work.title_ar : work.title);
  const getCategory = (work: Work) => (locale === 'ar' ? work.category_ar : work.category);

  return (
    <section className="featured-works section">
      <div className="container">
        <span className="section-badge">{t.works.badge}</span>
        <h2 className="section-title">{t.works.title}</h2>
        <p className="featured-works__subtitle">{t.works.subtitle}</p>
        <div className="featured-works__carousel-wrap">
          <div className="featured-works__carousel" dir="ltr">
            <div className="featured-works__track">
            {works.map((work) => (
              <button
                key={work.id}
                type="button"
                className="featured-works__card"
                onClick={() => navigate(`/portfolio/work/${work.id}`)}
              >
                <div className="featured-works__card-image-wrap">
                  <img
                    src={work.image_url}
                    alt={getTitle(work)}
                    className="featured-works__card-image"
                  />
                </div>
                <span className="featured-works__card-category">{getCategory(work)}</span>
                <h3 className="featured-works__card-title">{getTitle(work)}</h3>
              </button>
            ))}
            </div>
          </div>
        </div>
        <Link to="/portfolio" className="btn btn-primary featured-works__cta">
          {t.works.viewAll}
        </Link>
      </div>
    </section>
  );
}
