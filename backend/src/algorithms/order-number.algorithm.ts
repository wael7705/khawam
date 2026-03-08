/**
 * Order number generation: ORDyymmdd-xxx
 * Format: ORD + 2-digit year + 2-digit month + 2-digit day + "-" + sequential 3-digit number
 */

export function generateOrderNumber(date: Date, sequenceNumber: number): string {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const seq = String(sequenceNumber).padStart(3, '0');

  return `ORD${yy}${mm}${dd}-${seq}`;
}

export function parseOrderNumber(orderNumber: string): {
  date: string;
  sequence: number;
} | null {
  const match = orderNumber.match(/^ORD(\d{2})(\d{2})(\d{2})-(\d{3})$/);
  if (!match) return null;

  const [, yy, mm, dd, seq] = match;
  return {
    date: `20${yy}-${mm}-${dd}`,
    sequence: parseInt(seq!, 10),
  };
}
