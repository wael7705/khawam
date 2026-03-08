import { Link, useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from '../i18n';
import './ServicesCatalog.css';

interface CatalogService {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'printing' | 'design' | 'cards' | 'branding';
  subgroup?: string;
}

const CATALOG_SERVICES: CatalogService[] = [
  {
    id: 'svc-lecture',
    slug: 'lecture-printing',
    nameAr: 'طباعة محاضرات',
    nameEn: 'Lecture Printing',
    descriptionAr: 'طباعة محاضرات بجودة عالية وخيارات تجليد متعددة.',
    descriptionEn: 'High quality lecture printing with multiple binding options.',
    category: 'printing',
    subgroup: 'lectures',
  },
  {
    id: 'svc-clothing',
    slug: 'clothing-printing',
    nameAr: 'الطباعة على الملابس',
    nameEn: 'Clothing Printing',
    descriptionAr: 'طباعة الشعارات والتصاميم على الملابس.',
    descriptionEn: 'Print logos and designs on clothing.',
    category: 'printing',
    subgroup: 'clothing',
  },
  {
    id: 'svc-flex',
    slug: 'flex-printing',
    nameAr: 'طباعة فليكس',
    nameEn: 'Flex Printing',
    descriptionAr: 'طباعة فليكس خارجي وداخلي بأبعاد كبيرة.',
    descriptionEn: 'Indoor and outdoor flex printing in large sizes.',
    category: 'printing',
    subgroup: 'flex',
  },
  {
    id: 'svc-vinyl',
    slug: 'vinyl-printing',
    nameAr: 'طباعة فينيل',
    nameEn: 'Vinyl Printing',
    descriptionAr: 'طباعة فينيل لاصق بمقاسات متعددة.',
    descriptionEn: 'Vinyl sticker printing in multiple sizes.',
    category: 'branding',
    subgroup: 'vinyl',
  },
  {
    id: 'svc-brochure',
    slug: 'brochure-printing',
    nameAr: 'طباعة بروشورات',
    nameEn: 'Brochure Printing',
    descriptionAr: 'طباعة بروشورات احترافية بجودة ألوان ممتازة.',
    descriptionEn: 'Professional brochure printing with rich colors.',
    category: 'printing',
    subgroup: 'brochures',
  },
  {
    id: 'svc-business-card',
    slug: 'business-card-printing',
    nameAr: 'الكروت الشخصية',
    nameEn: 'Business Cards',
    descriptionAr: 'تصميم وطباعة كروت شخصية بأشكال متنوعة.',
    descriptionEn: 'Design and print business cards in many styles.',
    category: 'cards',
    subgroup: 'business-cards',
  },
  {
    id: 'svc-poster',
    slug: 'poster-printing',
    nameAr: 'طباعة كلك بولستر',
    nameEn: 'Glossy Poster Printing',
    descriptionAr: 'طباعة بوسترات لامعة بأحجام متعددة.',
    descriptionEn: 'Glossy poster printing in multiple sizes.',
    category: 'printing',
    subgroup: 'posters',
  },
  {
    id: 'svc-rollup',
    slug: 'rollup-banners',
    nameAr: 'البانرات الإعلانية (Roll up)',
    nameEn: 'Advertising Banners (Roll up)',
    descriptionAr: 'طباعة بانرات رول أب للمعارض والفعاليات.',
    descriptionEn: 'Roll-up banners for events and exhibitions.',
    category: 'branding',
    subgroup: 'rollup',
  },
  {
    id: 'svc-engineering',
    slug: 'engineering-printing',
    nameAr: 'طباعة مشاريع هندسية',
    nameEn: 'Engineering Printing',
    descriptionAr: 'طباعة مخططات ومشاريع هندسية بدقة عالية.',
    descriptionEn: 'High precision engineering drawings and projects printing.',
    category: 'printing',
    subgroup: 'engineering',
  },
  {
    id: 'svc-books',
    slug: 'books-printing',
    nameAr: 'طباعة كتب',
    nameEn: 'Books Printing',
    descriptionAr: 'طباعة كتب مع خيارات ورق وتجليد متنوعة.',
    descriptionEn: 'Book printing with various paper and binding options.',
    category: 'printing',
    subgroup: 'books',
  },
  {
    id: 'svc-thesis',
    slug: 'thesis-printing',
    nameAr: 'طباعة رسائل (ماجستير/دكتوراه)',
    nameEn: 'Thesis Printing',
    descriptionAr: 'طباعة وتجليد الرسائل الجامعية بشكل احترافي.',
    descriptionEn: 'Professional thesis printing and binding.',
    category: 'printing',
    subgroup: 'thesis',
  },
  {
    id: 'svc-quran',
    slug: 'quran-certificate',
    nameAr: 'طباعة إجازة حفظ القرآن الكريم',
    nameEn: 'Quran Certificate Printing',
    descriptionAr: 'طباعة إجازات حفظ القرآن بتشطيبات مميزة.',
    descriptionEn: 'Quran certificate printing with premium finishing.',
    category: 'printing',
    subgroup: 'certificate',
  },
  {
    id: 'svc-graphic',
    slug: 'graphic-design',
    nameAr: 'التصميم الجرافيكي',
    nameEn: 'Graphic Design',
    descriptionAr: 'تصميم شعارات وهوية بصرية ومحتوى إعلاني.',
    descriptionEn: 'Logo, brand identity, and marketing design services.',
    category: 'design',
    subgroup: 'graphic',
  },
];

function resolveCategoryFilter(
  category: string | undefined,
): { category: CatalogService['category']; subgroup?: string } | null {
  if (!category) return null;
  const map: Record<string, { category: CatalogService['category']; subgroup?: string }> = {
    printing: { category: 'printing' },
    tshirt: { category: 'printing', subgroup: 'clothing' },
    billboard: { category: 'branding' },
    branding: { category: 'design' },
    copyright: { category: 'design' },
    businesscard: { category: 'cards' },
  };
  return map[category] ?? null;
}

export function ServicesCatalog() {
  const { locale } = useTranslation();
  const { category } = useParams<{ category: string }>();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const categoryFilter = resolveCategoryFilter(category);
    const q = search.trim().toLowerCase();
    return CATALOG_SERVICES.filter((service) => {
      if (categoryFilter) {
        if (service.category !== categoryFilter.category) return false;
        if (categoryFilter.subgroup && service.subgroup !== categoryFilter.subgroup) return false;
      }
      if (!q) return true;
      return service.nameAr.toLowerCase().includes(q) || service.nameEn.toLowerCase().includes(q);
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
          {filtered.map((service) => (
            <article key={service.id} className="services-catalog__card">
              <h3>{locale === 'ar' ? service.nameAr : service.nameEn}</h3>
              <p>{locale === 'ar' ? service.descriptionAr : service.descriptionEn}</p>
              <Link to="/order" className="btn btn-primary services-catalog__btn">
                {locale === 'ar' ? 'اطلب خدمة' : 'Order Service'}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
