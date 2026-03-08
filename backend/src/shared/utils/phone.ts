export function normalizePhone(phone: string): string {
  if (!phone) return '';

  let cleaned = phone.replace(/[\s\-().+]/g, '');

  if (cleaned.startsWith('00963')) {
    cleaned = '0' + cleaned.slice(5);
  } else if (cleaned.startsWith('963')) {
    cleaned = '0' + cleaned.slice(3);
  }

  if (!cleaned.startsWith('0') && cleaned.length >= 9 && cleaned.length <= 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}
