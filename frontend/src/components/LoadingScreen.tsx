import './LoadingScreen.css';

export function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-label="جاري التحميل">
      <div className="loading-screen__inner">
        <img
          src="/images/logo.jpeg"
          alt="خوام"
          className="loading-screen__logo"
          width={120}
          height={120}
        />
        <p className="loading-screen__text">جاري التحميل...</p>
        <div className="loading-screen__bar" />
      </div>
    </div>
  );
}
