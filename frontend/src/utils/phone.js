/**
 * Normalizes a Rwandan phone number to E.164 format (+250XXXXXXXXX).
 * Accepts: 0788123456, 788123456, 250788123456, +250788123456
 */
export function normalizePhone(raw) {
  if (!raw) return raw;
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('250')) return `+${digits}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  if (digits.length === 9) return `+250${digits}`;
  if (digits.length >= 12) return `+${digits}`;
  return raw;
}

export function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const e164 = normalizePhone(phone);
  if (e164.startsWith('+250') && e164.length === 13) {
    return `${e164.slice(0, 4)} ${e164.slice(4, 7)} ${e164.slice(7, 10)} ${e164.slice(10)}`;
  }
  return e164;
}
