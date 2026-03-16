import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Printer,
  Shirt,
  Megaphone,
  Palette,
  PenTool,
  CreditCard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from '../i18n/index';
import { HERO_LINKS, getHeroLinkLabel } from '../lib/servicesCatalog';
import './HeroSection.css';

const HERO_ICONS: Record<string, LucideIcon> = {
  printing: Printer,
  tshirt: Shirt,
  billboard: Megaphone,
  branding: Palette,
  copyright: PenTool,
  businessCard: CreditCard,
};

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
        <div className="hero__overlay" aria-hidden="true" />

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

      <div id="services" className="hero__services">
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
              {HERO_LINKS.map((link) => {
                const Icon = HERO_ICONS[link.key];
                return (
                  <Link key={link.key} to={`/services/${link.slug}`} className="hero__svc">
                    <span className="hero__svc-icon">
                      {Icon ? <Icon size={32} strokeWidth={1.8} /> : null}
                    </span>
                    <span className="hero__svc-label">{getHeroLinkLabel(link, locale)}</span>
                  </Link>
                );
              })}
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
