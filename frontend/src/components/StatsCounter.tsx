import { useTranslation } from '../i18n/index';
import { useCountUp } from '../hooks/useCountUp';
import { FileText, Users, Globe, Award } from 'lucide-react';
import './StatsCounter.css';

const STATS = [
  { key: 'projects' as const, value: 500, icon: FileText },
  { key: 'staff' as const, value: 50, icon: Users },
  { key: 'experience' as const, value: 100, icon: Globe },
  { key: 'clients' as const, value: 1000, icon: Award },
];

function StatItem({ value, label, Icon }: { value: number; label: string; Icon: typeof FileText }) {
  const { count, ref } = useCountUp(value, 2000);

  return (
    <div ref={ref} className="stats-counter__item">
      <span className="stats-counter__num">{count}+</span>
      <span className="stats-counter__label">{label}</span>
      <div className="stats-counter__icon-wrap">
        <Icon size={24} />
      </div>
    </div>
  );
}

export function StatsCounter() {
  const { t } = useTranslation();

  return (
    <section className="stats-counter">
      <div className="stats-counter__bg-text" aria-hidden="true">
        COUNTER
      </div>
      <div className="container stats-counter__inner">
        {STATS.map(({ key, value, icon: Icon }) => (
          <StatItem
            key={key}
            value={value}
            label={t.stats[key]}
            Icon={Icon}
          />
        ))}
      </div>
    </section>
  );
}
