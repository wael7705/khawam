import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/index';
import { Phone, Mail, MapPin, Facebook, Send } from 'lucide-react';
import './Footer.css';

const CONTACT_PHONE = '963112134640';
const DISPLAY_PHONE = '+963112134640';
const WHATSAPP_URL = `https://wa.me/${CONTACT_PHONE}`;
const FACEBOOK_URL = 'https://www.facebook.com/Khawam.me/?locale=ar_AR';

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const QUICK_LINKS = [
  { key: 'home' as const, to: '/#home' },
  { key: 'services' as const, to: '/#services' },
  { key: 'works' as const, to: '/#works' },
  { key: 'contact' as const, to: '/#contact' },
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
            <span className="footer__phone" dir="ltr">{DISPLAY_PHONE}</span>
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
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <WhatsAppIcon size={20} />
            </a>
            <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
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
              {QUICK_LINKS.map(({ key, to }) => (
                <li key={key}>
                  <Link to={to}>{t.nav[key]}</Link>
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
                  <span className="footer__phone" dir="ltr">{DISPLAY_PHONE}</span>
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
