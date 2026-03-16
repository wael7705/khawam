import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Shirt,
  Layout,
  Sticker,
  BookMarked,
  CreditCard,
  Image,
  LayoutDashboard,
  Ruler,
  Book,
  GraduationCap,
  PenTool,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import { OrderModal } from '../components/order/OrderModal';
import { CATALOG_SERVICES, normalizeSearchText, serviceMatchesSearch, type CatalogService, type ServiceCategory } from '../lib/servicesCatalog';
import './ServicesCatalog.css';

const SERVICE_ICONS: Record<string, LucideIcon> = {
  'lecture-printing': BookOpen,
  'clothing-printing': Shirt,
  'flex-printing': Layout,
  'vinyl-printing': Sticker,
  'brochure-printing': BookMarked,
  'business-card-printing': CreditCard,
  'poster-printing': Image,
  'rollup-banners': LayoutDashboard,
  'engineering-printing': Ruler,
  'books-printing': Book,
  'thesis-printing': GraduationCap,
  'quran-certificate': BookMarked,
  'graphic-design': PenTool,
};

function getServiceIcon(slug: string): LucideIcon {
  return SERVICE_ICONS[slug] ?? BookOpen;
}

function clearOrderWizardStorage(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k != null && k.startsWith('orderWizard_')) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function resolveCategoryFilter(
  category: string | undefined,
): { category: ServiceCategory; subgroup?: string } | null {
  if (!category) return null;
  const map: Record<string, { category: ServiceCategory; subgroup?: string }> = {
    printing: { category: 'printing' },
    tshirt: { category: 'printing', subgroup: 'clothing' },
    billboard: { category: 'branding' },
    branding: { category: 'design' },
    copyright: { category: 'design' },
    businesscard: { category: 'cards' },
  };
  return map[category] ?? null;
}

interface ServicesCatalogProps {
  initialOrderSlug?: string | null;
}

export function ServicesCatalog({ initialOrderSlug }: ServicesCatalogProps) {
  const { locale } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [orderModalSlug, setOrderModalSlug] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderSlug && CATALOG_SERVICES.some((s) => s.slug === initialOrderSlug)) {
      setOrderModalSlug(initialOrderSlug);
    }
  }, [initialOrderSlug]);

  const closeOrderModal = () => {
    clearOrderWizardStorage();
    setOrderModalSlug(null);
    if (location.pathname.startsWith('/order/')) {
      navigate('/services', { replace: true });
    }
  };

  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/services' || path.startsWith('/services/')) {
      clearOrderWizardStorage();
    }
  }, [location.pathname]);

  const filtered = useMemo(() => {
    const categoryFilter = resolveCategoryFilter(category);
    const normalizedQuery = normalizeSearchText(search);
    return CATALOG_SERVICES.filter((service) => {
      if (categoryFilter) {
        if (service.category !== categoryFilter.category) return false;
        if (categoryFilter.subgroup) {
          if (service.subgroup !== categoryFilter.subgroup) return false;
        } else if (category === 'printing') {
          // خدمة طباعة الملابس تظهر فقط في /services/tshirt وليس في الطباعة الرئيسية
          if (service.subgroup === 'clothing') return false;
        }
      }
      return serviceMatchesSearch(service, normalizedQuery);
    });
  }, [category, search]);

  return (
    <section className="services-catalog section">
      <div className="container">
        <header className="services-catalog__head">
          <h1>{locale === 'ar' ? 'خدماتنا' : 'Our Services'}</h1>
          <p>{locale === 'ar' ? 'نقدم لكم أفضل وأعرق الخدمات' : 'Explore all our professional services'}</p>
        </header>

        <div className="services-catalog__search">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === 'ar' ? 'ابحث عن خدمة...' : 'Search service...'}
          />
        </div>

        <div className="services-catalog__grid">
          {filtered.map((service) => {
            const IconComponent = getServiceIcon(service.slug);
            return (
            <article key={service.id} className="services-catalog__card">
              <div className="services-catalog__card-icon-wrap" aria-hidden>
                <IconComponent className="services-catalog__card-icon" size={40} />
              </div>
              <h3>{locale === 'ar' ? service.nameAr : service.nameEn}</h3>
              <p>{locale === 'ar' ? service.descriptionAr : service.descriptionEn}</p>
              <button
                type="button"
                className="btn btn-primary services-catalog__btn"
                onClick={() => setOrderModalSlug(service.slug)}
              >
                {locale === 'ar' ? 'اطلب خدمة' : 'Order Service'}
              </button>
            </article>
          );
          })}
        </div>
      </div>

      {orderModalSlug && (
        <OrderModal
          serviceSlug={orderModalSlug}
          onClose={closeOrderModal}
          initialDeliveryData={location.state?.deliveryResult ?? undefined}
        />
      )}
    </section>
  );
}
