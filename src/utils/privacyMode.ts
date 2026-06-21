const COORDINATE_PATTERN = /\b-?\d{1,3}\.\d{3,}\s*,\s*-?\d{1,3}\.\d{3,}\b/g;
const BOOKING_REFERENCE_PATTERN = /\b(?:booking|reference|ref)\s*[:#-]?\s*[a-z0-9-]{4,}\b/gi;
const POSTCODE_PATTERN = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;

export function sanitizeHubText(value: string | undefined, privacyMode: boolean) {
  if (!value) return value;
  if (!privacyMode) return value;
  return value
    .replace(COORDINATE_PATTERN, "Location hidden")
    .replace(BOOKING_REFERENCE_PATTERN, "Reference hidden")
    .replace(POSTCODE_PATTERN, "Postcode hidden")
    .trim() || undefined;
}

export function hideInPrivacyMode<T>(value: T | undefined, privacyMode: boolean) {
  return privacyMode ? undefined : value;
}
