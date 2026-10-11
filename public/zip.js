/** Minimal ZIP builder using the STORE method (no compression or runtime dependency). */
const encoder = new TextEncoder();
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let value = n;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[n] = value >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function write16(view, offset, value) { view.setUint16(offset, value, true); }
function write32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

/** @param {Array<{name:string, blob:Blob}>} entries */
export async function buildZip(entries) {
  if (entries.length > 0xffff) throw new Error('ZIP arşivinde en fazla 65.535 dosya bulunabilir.');
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const entry of entries) {
    const filename = encoder.encode(entry.name);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const crc = crc32(data);
    const local = new Uint8Array(30 + filename.length);
    const localView = new DataView(local.buffer);
    write32(localView, 0, 0x04034b50); write16(localView, 4, 20); write16(localView, 6, 0x0800); write16(localView, 8, 0);
    write16(localView, 10, 0); write16(localView, 12, 0); write32(localView, 14, crc); write32(localView, 18, data.length);
    write32(localView, 22, data.length); write16(localView, 26, filename.length); write16(localView, 28, 0); local.set(filename, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + filename.length);
    const centralView = new DataView(central.buffer);
    write32(centralView, 0, 0x02014b50); write16(centralView, 4, 20); write16(centralView, 6, 20);
    write16(centralView, 8, 0x0800); write16(centralView, 10, 0); write16(centralView, 12, 0); write16(centralView, 14, 0);
    write32(centralView, 16, crc); write32(centralView, 20, data.length); write32(centralView, 24, data.length);
    write16(centralView, 28, filename.length); write16(centralView, 30, 0); write16(centralView, 32, 0);
    write16(centralView, 34, 0); write16(centralView, 36, 0); write32(centralView, 38, 0); write32(centralView, 42, offset);
    central.set(filename, 46); centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  write32(endView, 0, 0x06054b50); write16(endView, 4, 0); write16(endView, 6, 0);
  write16(endView, 8, entries.length); write16(endView, 10, entries.length); write32(endView, 12, centralSize);
  write32(endView, 16, offset); write16(endView, 20, 0);
  return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
}

/** @param {string} filename @param {Set<string>} seen */
export function uniqueArchiveName(filename, seen) {
  let candidate = filename;
  let counter = 2;
  while (seen.has(candidate.toLowerCase())) {
    const extension = filename.lastIndexOf('.');
    candidate = extension > 0 ? `${filename.slice(0, extension)}-${counter}${filename.slice(extension)}` : `${filename}-${counter}`;
    counter += 1;
  }
  seen.add(candidate.toLowerCase());
  return candidate;
}
