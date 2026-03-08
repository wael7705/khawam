import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../i18n/index';
import type { Work } from './FeaturedWorks';
import './WorkModal.css';

interface WorkModalProps {
  work: Work;
  onClose: () => void;
  locale: 'ar' | 'en';
}

export function WorkModal({ work, onClose, locale }: WorkModalProps) {
  const { t } = useTranslation();
  const [mainImage, setMainImage] = useState(work.image_url);
  const allImages = [...new Set([work.image_url, ...(work.images || [])].filter(Boolean))];

  const getTitle = () => (locale === 'ar' ? work.title_ar : work.title);
  const getDescription = () => (locale === 'ar' ? work.description_ar : work.description);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    setMainImage(work.image_url);
  }, [work]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <div
      className="work-modal__overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-modal-title"
    >
      <div className="work-modal__content">
        <button
          type="button"
          className="work-modal__close"
          onClick={onClose}
          aria-label={t.works.close}
        >
          <X size={28} />
        </button>
        <div className="work-modal__main-image-wrap">
          <img
            src={mainImage}
            alt={getTitle()}
            className="work-modal__main-image"
          />
        </div>
        {allImages.length > 1 && (
          <div className="work-modal__thumbnails">
            {allImages.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`work-modal__thumb ${mainImage === src ? 'work-modal__thumb--active' : ''}`}
                onClick={() => setMainImage(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        )}
        <h2 id="work-modal-title" className="work-modal__title">
          {getTitle()}
        </h2>
        {getDescription() && (
          <p className="work-modal__description">{getDescription()}</p>
        )}
      </div>
    </div>
  );
}
