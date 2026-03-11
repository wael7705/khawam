import { useState } from 'react';
import { useTranslation } from '../i18n/index';
import { Phone, Mail, MapPin, Facebook, Send } from 'lucide-react';
import './Footer.css';

const QUICK_LINKS = [
  { key: 'home' as const, href: '#home' },
  { key: 'services' as const, href: '#services' },
  { key: 'works' as const, href: '#works' },
  { key: 'contact' as const, href: '#contact' },
];

const MAP_URL = 'https://maps.google.com/?q=33.509361,36.287889';

export function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <footer id="contact" className="footer">
      <div className="footer__top">
        <div className="container footer__top-inner">
          <a href="/" className="footer__logo">
            <img src="/images/logo.jpeg" alt="Khawam" height={40} />
          </a>
          <a href="tel:+963112134640" className="footer__top-link">
            <Phone size={18} />
            <span>+963112134640</span>
          </a>
          <a href="mailto:eyadmrx@gmail.com" className="footer__top-link">
            <Mail size={18} />
            <span>eyadmrx@gmail.com</span>
          </a>
          <a href={MAP_URL} target="_blank" rel="noopener noreferrer" className="footer__top-link">
            <MapPin size={18} />
            <span>دمشق - البرامكة</span>
          </a>
          <div className="footer__social">
            <a href="https://www.facebook.com/Khawam.me" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </div>
      <div className="footer__main">
        <div className="container footer__main-inner">
          <div className="footer__col">
            <h3 className="footer__col-title">{t.footer.aboutTitle}</h3>
            <p className="footer__col-text">{t.footer.aboutText}</p>
          </div>
          <div className="footer__col">
            <h3 className="footer__col-title">{t.footer.linksTitle}</h3>
            <ul className="footer__links">
              {QUICK_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <a href={href}>{t.nav[key]}</a>
                </li>
              ))}
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__col-title">{t.footer.contactTitle}</h3>
            <ul className="footer__contact">
              <li>
                <a href="tel:+963112134640">
                  <Phone size={16} />
                  <span>+963112134640</span>
                </a>
              </li>
              <li>
                <a href="mailto:eyadmrx@gmail.com">
                  <Mail size={16} />
                  <span>eyadmrx@gmail.com</span>
                </a>
              </li>
              <li>
                <a href={MAP_URL} target="_blank" rel="noopener noreferrer">
                  <MapPin size={16} />
                  <span>دمشق - البرامكة</span>
                </a>
              </li>
            </ul>
          </div>
          <div className="footer__col">
            <h3 className="footer__col-title">{t.footer.subscribeTitle}</h3>
            <p className="footer__subscribe-note">{t.footer.subscribeNote}</p>
            <form onSubmit={handleSubscribe} className="footer__subscribe">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.footer.subscribePlaceholder}
                className="footer__subscribe-input"
                required
              />
              <button type="submit" className="footer__subscribe-btn">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="container">
          <p className="footer__copyright">{t.footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
