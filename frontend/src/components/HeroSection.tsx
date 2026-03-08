import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  FaPrint,
  FaShirt,
  FaPersonChalkboard,
  FaSwatchbook,
  FaCopyright,
  FaIdCard,
} from 'react-icons/fa6';
import { useTranslation } from '../i18n/index';
import './HeroSection.css';

const services = [
  { key: 'printing', slug: 'printing', Icon: FaPrint },
  { key: 'tshirt', slug: 'tshirt', Icon: FaShirt },
  { key: 'billboard', slug: 'billboard', Icon: FaPersonChalkboard },
  { key: 'branding', slug: 'branding', Icon: FaSwatchbook },
  { key: 'copyright', slug: 'copyright', Icon: FaCopyright },
  { key: 'businessCard', slug: 'businesscard', Icon: FaIdCard },
] as const;

export function HeroSection() {
  const { t, locale } = useTranslation();
  const servicesTrackRef = useRef<HTMLDivElement | null>(null);

  const scrollServices = (direction: 'prev' | 'next') => {
    const track = servicesTrackRef.current;
    if (!track) return;
    const amount = Math.round(track.clientWidth * 0.72);
    const rtl = document.documentElement.dir === 'rtl';
    const signed = direction === 'next' ? amount : -amount;
    track.scrollBy({ left: rtl ? -signed : signed, behavior: 'smooth' });
  };

  return (
    <section className="hero">
      <div className="hero__inner">
        <div className="hero__bg-image">
          <img src="/images/hero-mockup.jpg" alt="" />
        </div>

        <div className="hero__text-col">
          <div className="hero__text-wrap">
            <span className="hero__badge">{t.hero.badge}</span>
            <h1 className="hero__title">
              {t.hero.title.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t.hero.title.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="hero__desc">{t.hero.desc}</p>
            <div className="hero__btns">
              <Link to="/order" className="hero__btn-cta">
                <Sparkles size={18} />
                {t.hero.cta}
              </Link>
              <a href="#process" className="hero__btn-how">
                {t.hero.howItWorks}
                {locale === 'ar' ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__services">
        <div className="hero__services-wrap">
          <button
            type="button"
            className="hero__services-nav hero__services-nav--prev"
            onClick={() => scrollServices('prev')}
            aria-label={locale === 'ar' ? 'السابق' : 'Previous'}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="hero__services-track" ref={servicesTrackRef}>
            <div className="hero__services-grid">
              {services.map(({ key, slug, Icon }) => (
                <Link key={key} to={`/services/${slug}`} className="hero__svc">
                  <span className="hero__svc-icon">
                    <Icon size={34} />
                  </span>
                  <span className="hero__svc-label">{t.services_icons[key]}</span>
                </Link>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="hero__services-nav hero__services-nav--next"
            onClick={() => scrollServices('next')}
            aria-label={locale === 'ar' ? 'التالي' : 'Next'}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
