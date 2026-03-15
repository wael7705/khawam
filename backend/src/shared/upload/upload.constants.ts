/**
 * ثوابت رفع الملفات — مرجع واحد لتسهيل التعديل والاكتشاف.
 * لا تُعيّن Content-Type في العميل؛ المتصفح يضيف multipart/form-data مع boundary.
 */

/** اسم الحقل في FormData (يجب أن يتطابق مع الفرونت) */
export const UPLOAD_FIELD_NAME = 'file' as const;

/** أقصى حجم لملف واحد (بايت) — 50 MB */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** أقصى عدد ملفات في طلب batch */
export const MAX_FILES_PER_REQUEST = 20;

/** امتدادات مسموحة: صور + مستندات + تصميم */
export const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.ai', '.psd', '.eps', '.dwg', '.dxf',
]);

export const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg',
]);
