/**
 * ثوابت وتحقق رفع الملفات — يطابق الـ backend (upload.constants + مسموح به).
 * لا تعيّن Content-Type أبداً؛ المتصفح يضيف multipart/form-data مع boundary.
 */

/** اسم الحقل في FormData — يجب أن يطابق الـ backend */
export const UPLOAD_FIELD_NAME = 'file' as const;

/** أقصى حجم لملف واحد (بايت) — 50 MB */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** امتدادات مسموحة (صور + مستندات + تصميم) */
export const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ai', '.psd', '.eps', '.dwg', '.dxf',
]);

export function getExtension(name: string): string {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
}

export function isAllowedFile(file: File): { ok: true } | { ok: false; error: string } {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: `نوع الملف غير مسموح: ${ext || 'بدون امتداد'}` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const maxMb = Math.round(MAX_FILE_SIZE_BYTES / 1024 / 1024);
    return { ok: false, error: `حجم الملف يتجاوز ${maxMb} ميجابايت` };
  }
  return { ok: true };
}
