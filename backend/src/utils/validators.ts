export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePan(pan: string): boolean {
  return PAN_REGEX.test(pan.trim().toUpperCase());
}

export function validateGstin(gstin: string): boolean {
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export function validatePhone(phone: string): boolean {
  // Strip non-digits and leading country code +91 or 91 if 12 digits
  const cleaned = phone.replace(/\D/g, '');
  const tenDigit = cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
  return PHONE_REGEX.test(tenDigit);
}

export function cleanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 12 && cleaned.startsWith('91') ? cleaned.slice(2) : cleaned;
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim().toLowerCase());
}
