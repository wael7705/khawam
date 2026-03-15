import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  ImageMinus,
  ImagePlus,
  Download,
  FileImage,
  Printer,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  CircleDot,
  Contrast,
  ImageIcon,
  ScanLine,
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { studioAPI, getStudioImageUrl } from '../lib/api';
import { jsPDF } from 'jspdf';
import './Studio.css';

export function Studio() {
  const { locale } = useTranslation();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passportRemoveBg, setPassportRemoveBg] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const boardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const isRtl = locale === 'ar';
  const t = {
    title: isRtl ? 'الاستديو' : 'Studio',
    upload: isRtl ? 'رفع صورة' : 'Upload image',
    removeBg: isRtl ? 'إزالة الخلفية' : 'Remove background',
    passport: isRtl ? 'صور شخصية 3.5×4.8' : 'Passport 3.5×4.8',
    passportRemoveBgFirst: isRtl ? 'إزالة الخلفية أولاً' : 'Remove background first',
    filter: isRtl ? 'فلاتر' : 'Filters',
    grayscale: isRtl ? 'رمادي' : 'Grayscale',
    sepia: isRtl ? 'سيبيا' : 'Sepia',
    blur: isRtl ? 'ضبابية' : 'Blur',
    exportPng: isRtl ? 'تصدير PNG' : 'Export PNG',
    exportPdf: isRtl ? 'تصدير PDF' : 'Export PDF',
    print: isRtl ? 'طباعة' : 'Print',
    placeholder: isRtl ? 'ارفع صورة لبدء التعديل. Ctrl+P للطباعة.' : 'Upload an image to start. Ctrl+P to print.',
    nonImageUploaded: isRtl ? 'تم رفع الملف. معاينة وتعديل الصور تتطلب صورة (png, jpg, webp, gif, svg).' : 'File uploaded. Preview and image tools require an image (png, jpg, webp, gif, svg).',
    backToSite: isRtl ? 'العودة للموقع' : 'Back to site',
  };

  const getCurrentFile = useCallback(async (): Promise<File | null> => {
    if (currentFile) return currentFile;
    if (!imageUrl) return null;
    try {
      const fullUrl = imageUrl.startsWith('http') ? imageUrl : getStudioImageUrl(imageUrl);
      const res = await fetch(fullUrl, { mode: 'cors' });
      const blob = await res.blob();
      return new File([blob], 'image.png', { type: blob.type || 'image/png' });
    } catch {
      return null;
    }
  }, [currentFile, imageUrl]);

  const studioAllowedExtensions = useMemo(
    () => new Set(['.psd', '.pdf', '.ai', '.eps', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']),
    [],
  );
  const getFileExtension = (name: string) => {
    const i = name.toLowerCase().lastIndexOf('.');
    return i >= 0 ? name.slice(i).toLowerCase() : '';
  };
  const isImageExtension = (ext: string) =>
    ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ext = getFileExtension(file.name);
      if (!studioAllowedExtensions.has(ext)) {
        setError(isRtl ? 'نوع الملف غير مسموح. المسموح: psd, pdf, ai, eps, png, jpg, webp, gif, svg' : 'File type not allowed. Allowed: psd, pdf, ai, eps, png, jpg, webp, gif, svg');
        e.target.value = '';
        return;
      }
      setCurrentFile(file);
      setError(null);
      if (file.type.startsWith('image/') || isImageExtension(ext)) {
        setImageUrl(URL.createObjectURL(file));
      } else {
        setImageUrl(null);
      }
      e.target.value = '';
    },
    [isRtl, studioAllowedExtensions],
  );

  const runApi = useCallback(
    async (
      name: string,
      fn: () => Promise<{ data: { path: string; url: string } }>,
    ) => {
      setLoading(name);
      setError(null);
      try {
        const { data } = await fn();
        const path = data?.path ?? data?.url;
        if (path) setImageUrl(path);
        setCurrentFile(null);
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : (err as Error)?.message;
        setError(msg || (isRtl ? 'حدث خطأ' : 'Something went wrong'));
      } finally {
        setLoading(null);
      }
    },
    [isRtl],
  );

  const handleRemoveBg = useCallback(async () => {
    const file = await getCurrentFile();
    if (!file) {
      setError(isRtl ? 'ارفع صورة أولاً' : 'Upload an image first');
      return;
    }
    await runApi('removeBg', () => studioAPI.removeBackground(file));
  }, [getCurrentFile, runApi, isRtl]);

  const handlePassport = useCallback(async () => {
    const file = await getCurrentFile();
    if (!file) {
      setError(isRtl ? 'ارفع صورة أولاً' : 'Upload an image first');
      return;
    }
    await runApi('passport', () => studioAPI.passportPhotos(file, passportRemoveBg));
  }, [getCurrentFile, runApi, passportRemoveBg, isRtl]);

  const handleFilter = useCallback(
    async (filter: 'grayscale' | 'sepia' | 'blur') => {
      const file = await getCurrentFile();
      if (!file) {
        setError(isRtl ? 'ارفع صورة أولاً' : 'Upload an image first');
        return;
      }
      await runApi('filter', () => studioAPI.applyFilter(file, filter));
    },
    [getCurrentFile, runApi, isRtl],
  );

  const handleExportPng = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.complete || !img.naturalWidth) {
      setError(isRtl ? 'لا توجد صورة للتصدير' : 'No image to export');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `studio-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, 'image/png');
  }, [isRtl]);

  const handleExportPdf = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.complete || !img.naturalWidth) {
      setError(isRtl ? 'لا توجد صورة للتصدير' : 'No image to export');
      return;
    }
    const doc = new jsPDF({
      orientation: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait',
      unit: 'mm',
    });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / img.naturalWidth, pageH / img.naturalHeight);
    const w = img.naturalWidth * ratio;
    const h = img.naturalHeight * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    doc.addImage(img.src, 'PNG', x, y, w, h);
    doc.save(`studio-${Date.now()}.pdf`);
  }, [isRtl]);

  const handlePrint = useCallback(() => window.print(), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlePrint]);

  const fullImageUrl = imageUrl && !imageUrl.startsWith('http') ? getStudioImageUrl(imageUrl) : imageUrl;

  return (
    <div className="studio-app" data-expanded={sidebarExpanded}>
      <header className="studio-header">
        <div className="studio-header__left">
          <Link to="/" className="studio-header__back">
            {t.backToSite}
          </Link>
          <span className="studio-header__title">{t.title}</span>
        </div>
      </header>

      <aside className={`studio-sidebar ${sidebarExpanded ? 'studio-sidebar--expanded' : 'studio-sidebar--collapsed'}`}>
        <button
          type="button"
          className="studio-sidebar__toggle"
          onClick={() => setSidebarExpanded((e) => !e)}
          title={sidebarExpanded ? (isRtl ? 'طي الشريط' : 'Collapse') : (isRtl ? 'توسيع الشريط' : 'Expand')}
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarExpanded ? (
            <PanelLeftClose size={20} />
          ) : (
            <PanelLeft size={20} />
          )}
        </button>

        <nav className="studio-sidebar__nav">
          <div className="studio-sidebar__group">
            <span className="studio-sidebar__group-label">{sidebarExpanded && (isRtl ? 'ملف' : 'File')}</span>
            <label className="studio-tool" title={t.upload}>
              <Upload size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.upload}</span>}
              <input
              type="file"
              accept=".psd,.pdf,.ai,.eps,.png,.jpg,.jpeg,.webp,.gif,.svg"
              className="studio-tool__input"
              onChange={handleUpload}
            />
            </label>
          </div>

          <div className="studio-sidebar__group">
            <span className="studio-sidebar__group-label">{sidebarExpanded && (isRtl ? 'معالجة' : 'Process')}</span>
            <button
              type="button"
              className="studio-tool"
              onClick={handleRemoveBg}
              disabled={!!loading || !imageUrl}
              title={t.removeBg}
            >
              {loading === 'removeBg' ? <Loader2 size={22} className="studio-tool__spinner" /> : <ImageMinus size={22} />}
              {sidebarExpanded && <span className="studio-tool__label">{t.removeBg}</span>}
            </button>
            <button
              type="button"
              className="studio-tool"
              onClick={handlePassport}
              disabled={!!loading || !imageUrl}
              title={t.passport}
            >
              {loading === 'passport' ? <Loader2 size={22} className="studio-tool__spinner" /> : <ImagePlus size={22} />}
              {sidebarExpanded && <span className="studio-tool__label">{t.passport}</span>}
            </button>
            {sidebarExpanded && (
              <label className="studio-tool studio-tool--checkbox">
                <input
                  type="checkbox"
                  checked={passportRemoveBg}
                  onChange={(e) => setPassportRemoveBg(e.target.checked)}
                />
                <CircleDot size={18} />
                <span className="studio-tool__label">{t.passportRemoveBgFirst}</span>
              </label>
            )}
          </div>

          <div className="studio-sidebar__group">
            <span className="studio-sidebar__group-label">{sidebarExpanded && t.filter}</span>
            <button
              type="button"
              className="studio-tool"
              onClick={() => handleFilter('grayscale')}
              disabled={!!loading || !imageUrl}
              title={t.grayscale}
            >
              <Contrast size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.grayscale}</span>}
            </button>
            <button
              type="button"
              className="studio-tool"
              onClick={() => handleFilter('sepia')}
              disabled={!!loading || !imageUrl}
              title={t.sepia}
            >
              <ImageIcon size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.sepia}</span>}
            </button>
            <button
              type="button"
              className="studio-tool"
              onClick={() => handleFilter('blur')}
              disabled={!!loading || !imageUrl}
              title={t.blur}
            >
              <ScanLine size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.blur}</span>}
            </button>
          </div>

          <div className="studio-sidebar__group">
            <span className="studio-sidebar__group-label">{sidebarExpanded && (isRtl ? 'تصدير' : 'Export')}</span>
            <button type="button" className="studio-tool" onClick={handleExportPng} disabled={!imageUrl} title={t.exportPng}>
              <Download size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.exportPng}</span>}
            </button>
            <button type="button" className="studio-tool" onClick={handleExportPdf} disabled={!imageUrl} title={t.exportPdf}>
              <FileImage size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.exportPdf}</span>}
            </button>
            <button type="button" className="studio-tool" onClick={handlePrint} disabled={!imageUrl} title={t.print}>
              <Printer size={22} />
              {sidebarExpanded && <span className="studio-tool__label">{t.print}</span>}
            </button>
          </div>
        </nav>
      </aside>

      <main className="studio-main" ref={boardRef}>
        {error && (
          <div className="studio-error" role="alert">
            {error}
          </div>
        )}
        <div className="studio-board">
          {fullImageUrl ? (
            <img ref={imgRef} src={fullImageUrl} alt="" crossOrigin="anonymous" />
          ) : (
            <p className="studio-board-placeholder">
              {currentFile && !imageUrl ? t.nonImageUploaded : t.placeholder}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
