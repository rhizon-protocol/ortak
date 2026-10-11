/** @typedef {'image/jpeg'|'image/png'|'image/webp'} ImageMime */
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES = 30;
export const MAX_BATCH_BYTES = 100 * 1024 * 1024;
export const MAX_BATCH_OUTPUT_BYTES = 200 * 1024 * 1024;
export const MAX_PIXELS = 16_000_000;
export const MAX_SIDE = 12_000;
export const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** @param {number} bytes */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let i = 1; value >= 1024 && i < units.length; i += 1) {
    value /= 1024;
    unit = units[i];
  }
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${unit}`;
}

/** @param {number} startBytes @param {number} endBytes */
export function savedPercent(startBytes, endBytes) {
  if (!Number.isFinite(startBytes) || startBytes <= 0 || !Number.isFinite(endBytes)) return 0;
  return Math.round((1 - endBytes / startBytes) * 100);
}

/** @param {number} width @param {number} height @param {number} maxWidth @param {number} maxHeight */
export function resizeDimensions(width, height, maxWidth, maxHeight) {
  if (![width, height, maxWidth, maxHeight].every(Number.isFinite) || width < 1 || height < 1 || maxWidth < 1 || maxHeight < 1) {
    throw new Error('Görsel boyutları geçersiz.');
  }
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** @param {File} file */
export function validateImageFile(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mime = file.type.toLowerCase();
  const extensionOkay = ['jpg', 'jpeg', 'png', 'webp'].includes(extension ?? '');
  const mimeByExtension = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  const mimeOkay = mime === '' ? extensionOkay : ALLOWED_MIMES.has(mime) && mime === mimeByExtension[extension];
  if (!mimeOkay || !extensionOkay) {
    return { ok: false, reason: 'Bu dosya türü desteklenmiyor. JPEG, PNG veya WebP seçin.' };
  }
  if (file.size <= 0) return { ok: false, reason: 'Dosya boş görünüyor.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'Dosya 20 MB sınırını aşıyor.' };
  return { ok: true, reason: '' };
}

/** @param {string} name @param {string} mime */
export function outputName(name, mime) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-').trim() || 'gorsel';
  const suffix = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
  return `${base}-ortak.${suffix}`;
}

/** @param {string} format @param {string} sourceMime */
export function transparencyWarning(format, sourceMime) {
  return format === 'image/jpeg' && (sourceMime === 'image/png' || sourceMime === 'image/webp')
    ? 'JPEG saydamlığı desteklemez. Saydam alanlar düz bir arka planla kaydedilebilir.'
    : '';
}

/** @param {unknown} value */
export function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** @param {string} name */
export function safeDisplayName(name) {
  return name.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-').slice(0, 120) || 'gorsel';
}
