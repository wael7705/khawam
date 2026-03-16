import { useRef, useState, useCallback } from 'react';
import { ordersAPI } from '../../../lib/api';
import type { OrderData } from '../OrderWizard';

interface Props {
  orderData: OrderData;
  updateData: <K extends keyof OrderData>(key: K, value: OrderData[K]) => void;
  stepConfig: Record<string, any>;
  locale: 'ar' | 'en';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadStep({ orderData, updateData, stepConfig, locale }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState<Set<string>>(new Set());

  const accept = stepConfig.accept || '';
  const showQuantity = stepConfig.show_quantity ?? false;
  const analyzePages = stepConfig.analyze_pages ?? false;

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles);
      const updated = [...orderData.files, ...arr];
      updateData('files', updated);

      if (analyzePages) {
        const pdfs = arr.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 0) return;

        const newAnalyzing = new Set(analyzing);
        pdfs.forEach((f) => newAnalyzing.add(f.name));
        setAnalyzing(newAnalyzing);

        (async () => {
          let newPages = 0;
          for (const file of pdfs) {
            try {
              const result = await ordersAPI.analyzePages(file);
              if (!result.unsupported && result.pages > 0) {
                newPages += result.pages;
              }
            } catch {
              // skip failed file
            }
          }
          setAnalyzing((prev) => {
            const next = new Set(prev);
            pdfs.forEach((f) => next.delete(f.name));
            return next;
          });
          if (newPages > 0) {
            const current = Number(orderData.number_of_pages) || 0;
            updateData('number_of_pages', current + newPages);
          }
        })();
      }
    },
    [orderData.files, updateData, analyzePages, analyzing],
  );

  const removeFile = useCallback(
    (index: number) => {
      const updated = orderData.files.filter((_, i) => i !== index);
      updateData('files', updated);
    },
    [orderData.files, updateData],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles],
  );

  return (
    <div>
      <div
        className={`file-upload-zone${dragActive ? ' file-upload-zone--active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="file-upload-zone__icon">📁</div>
        <p className="file-upload-zone__text">
          {locale === 'ar' ? (
            <>
              اسحب الملفات هنا أو <strong>انقر للاختيار</strong>
            </>
          ) : (
            <>
              Drag files here or <strong>click to browse</strong>
            </>
          )}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {orderData.uploadedFileResults.length > 0 && (
        <div className="file-list file-list--uploaded">
          <p className="file-list__uploaded-hint">
            {locale === 'ar' ? 'ملفات مرفوعة — ستُستخدم عند إرسال الطلب' : 'Uploaded files — will be used when submitting the order'}
          </p>
          {orderData.uploadedFileResults.map((f, i) => (
            <div key={`uploaded-${i}-${f.filename}`} className="file-item file-item--uploaded">
              <div className="file-item__info">
                <span className="file-item__icon">📄</span>
                <span className="file-item__name">{f.original_name ?? f.filename}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {orderData.files.length > 0 && (
        <div className="file-list">
          {orderData.files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="file-item">
              <div className="file-item__info">
                <span className="file-item__icon">📄</span>
                <span className="file-item__name">{file.name}</span>
                <span className="file-item__size">{formatSize(file.size)}</span>
                {analyzing.has(file.name) && (
                  <span className="file-item__analyzing">
                    {locale === 'ar' ? 'جاري الفحص...' : 'Analyzing...'}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="file-item__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showQuantity && (
        <div className="quantity-row">
          <label>{locale === 'ar' ? 'الكمية:' : 'Quantity:'}</label>
          <input
            type="number"
            className="step-input"
            min={1}
            value={orderData.quantity}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateData('quantity', Math.max(1, parseInt(e.target.value) || 1))
            }
          />
        </div>
      )}
    </div>
  );
}
