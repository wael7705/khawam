import { useRef, useState, useCallback } from 'react';
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
        const newAnalyzing = new Set(analyzing);
        arr.forEach((f) => {
          if (f.type === 'application/pdf') {
            newAnalyzing.add(f.name);
          }
        });
        setAnalyzing(newAnalyzing);

        setTimeout(() => {
          setAnalyzing(new Set());
          updateData('number_of_pages', updated.length);
        }, 1500);
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
