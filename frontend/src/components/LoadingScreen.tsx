import { useId } from 'react';
import './LoadingScreen.css';

function CornerDecorTopLeft({ gradId }: { gradId: string }) {
  return (
    <svg className="loading-screen__decor-svg loading-screen__decor-svg--tl" viewBox="0 0 220 220" aria-hidden>
      <defs>
        <linearGradient id={`${gradId}-tl-a`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F28B82" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity={0.12} />
        </linearGradient>
        <linearGradient id={`${gradId}-tl-b`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity={0.22} />
          <stop offset="100%" stopColor="#F28B82" stopOpacity={0.08} />
        </linearGradient>
      </defs>
      <polygon points="0,0 140,0 0,100" fill={`url(#${gradId}-tl-a)`} />
      <polygon points="0,100 95,15 110,95" fill={`url(#${gradId}-tl-b)`} />
      <polygon points="130,0 220,0 180,75" fill="#D32F2F" fillOpacity={0.1} />
    </svg>
  );
}

function CornerDecorBottomRight({ gradId }: { gradId: string }) {
  return (
    <svg className="loading-screen__decor-svg loading-screen__decor-svg--br" viewBox="0 0 260 260" aria-hidden>
      <defs>
        <linearGradient id={`${gradId}-br-a`} x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#F28B82" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#D32F2F" stopOpacity={0.14} />
        </linearGradient>
        <linearGradient id={`${gradId}-br-b`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D32F2F" stopOpacity={0.2} />
          <stop offset="100%" stopColor="#E57373" stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <polygon points="260,260 100,260 260,120" fill={`url(#${gradId}-br-a)`} />
      <polygon points="260,120 140,260 200,180" fill={`url(#${gradId}-br-b)`} />
      <polygon points="260,40 260,0 180,0" fill="#D32F2F" fillOpacity={0.11} />
      <polygon points="180,260 260,200 260,260" fill="#F28B82" fillOpacity={0.12} />
    </svg>
  );
}

export function LoadingScreen() {
  const reactId = useId();
  const gradId = `ls-${reactId.replace(/:/g, '')}`;
  const spinnerGradId = `${gradId}-spinner`;

  return (
    <div className="loading-screen" role="status" aria-label="جاري التحميل">
      <div className="loading-screen__decor loading-screen__decor--tl" aria-hidden>
        <CornerDecorTopLeft gradId={gradId} />
      </div>
      <div className="loading-screen__decor loading-screen__decor--br" aria-hidden>
        <CornerDecorBottomRight gradId={gradId} />
      </div>

      <div className="loading-screen__inner">
        <div className="loading-screen__brand">
          <span className="loading-screen__brand-ar">خوام</span>
          <span className="loading-screen__brand-en">KHAWAM</span>
        </div>

        <h1 className="loading-screen__headline">
          جاهزون للإبداع...
          <br />
          نحمل طابع طلبك!
        </h1>

        <div className="loading-screen__spinner-wrap" aria-hidden>
          <svg
            className="loading-screen__spinner"
            viewBox="0 0 56 56"
            role="presentation"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id={spinnerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F28B82" />
                <stop offset="100%" stopColor="#D32F2F" />
              </linearGradient>
            </defs>
            <circle
              className="loading-screen__spinner-ring"
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke={`url(#${spinnerGradId})`}
              strokeWidth="5"
              strokeDasharray="14 16"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p className="loading-screen__footer">يرجى الانتظار قليلاً</p>
      </div>
    </div>
  );
}
