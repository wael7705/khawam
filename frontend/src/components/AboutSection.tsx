import { useTranslation } from '../i18n/index';
import { Check, User } from 'lucide-react';
import './AboutSection.css';

const WEEKDAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'] as const;
const FRIDAY = 'fri';

export function AboutSection() {
  const { t } = useTranslation();

  return (
    <section id="about" className="about-section section">
      <div className="container">
        <span className="about-section__badge section-badge">{t.about.badge}</span>
        <h2 className="about-section__title section-title">{t.about.title}</h2>
        <div className="about-section__paragraphs">
          <p className="about-section__p">{t.about.p1}</p>
          <p className="about-section__p">{t.about.p2}</p>
        </div>
        <div className="about-section__grid">
          <div className="about-section__col about-section__col--image">
            <img
              src="/images/about-worker.png"
              alt=""
              className="about-section__img"
            />
          </div>
          <div className="about-section__col about-section__col--features">
            <ul className="about-section__features">
              {t.about.features.map((feature, i) => (
                <li key={i} className="about-section__feature">
                  <Check className="about-section__check" size={20} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="about-section__avatar">
              <User size={32} />
            </div>
          </div>
          <div className="about-section__col about-section__col--hours">
            <div className="about-section__card">
              <h3 className="about-section__card-title">{t.about.workingHours}</h3>
              <ul className="about-section__days">
                {WEEKDAYS.map((day) => (
                  <li key={day} className="about-section__day">
                    <span>{t.about.days[day]}</span>
                    <span>{t.about.time}</span>
                  </li>
                ))}
                <li className="about-section__day about-section__day--off">
                  <span>{t.about.days[FRIDAY]}</span>
                  <span className="about-section__off">{t.about.offDay}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
