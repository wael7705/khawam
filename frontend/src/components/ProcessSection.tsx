import { useTranslation } from '../i18n/index';
import { Send } from 'lucide-react';
import './ProcessSection.css';

export function ProcessSection() {
  const { t } = useTranslation();

  return (
    <section id="process" className="process-section section">
      <div className="container">
        <span className="process-section__badge section-badge">{t.process.badge}</span>
        <h2 className="process-section__title section-title">{t.process.title}</h2>
        <div className="process-section__steps">
          {t.process.steps.map((step, i) => (
            <div key={i} className="process-section__step" style={{ '--step-index': i } as React.CSSProperties}>
              <div className="process-section__card">
                <span className="process-section__num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="process-section__step-label">{t.process.step}</span>
              </div>
              <p className="process-section__subtitle">{step.subtitle}</p>
              <h3 className="process-section__step-title">{step.title}</h3>
              {i < t.process.steps.length - 1 && (
                <div className="process-section__connector" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
        <div className="process-section__images">
          {[1, 2, 3, 4].map((n) => (
            <img
              key={n}
              src={`/images/process-${n}.png`}
              alt=""
              className="process-section__img"
            />
          ))}
        </div>
        <div className="process-section__deco" aria-hidden="true">
          <Send size={48} />
        </div>
      </div>
    </section>
  );
}
