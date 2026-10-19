/**
 * Normalizes a Rwandan phone number to E.164 format (+250XXXXXXXXX).
 * Accepts: 0788123456, 788123456, 250788123456, +250788123456
 */
export function normalizeRwandaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('250')) return `+${digits}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  if (digits.length === 9) return `+250${digits}`;
  return `+${digits}`;
}
