import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, savedPercent, resizeDimensions, validateImageFile, outputName, transparencyWarning, MAX_FILE_BYTES, MAX_FILES, MAX_BATCH_BYTES, MAX_BATCH_OUTPUT_BYTES, MAX_PIXELS } from '../public/core.js';
import { buildZip, uniqueArchiveName } from '../public/zip.js';

function fakeFile(name, type, size = 100) {
  return { name, type, size };
}

test('formatBytes formats zero, bytes, and Turkish decimal values', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(150), '150 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1536), '1,5 MB');
  assert.equal(formatBytes(-1), '—');
});

test('savedPercent covers compression, growth, and invalid inputs', () => {
  assert.equal(savedPercent(1000, 500), 50);
  assert.equal(savedPercent(1000, 1250), -25);
  assert.equal(savedPercent(0, 12), 0);
  assert.equal(savedPercent(12, 12), 0);
});

test('resizeDimensions maintains aspect ratio and never enlarges', () => {
  assert.deepEqual(resizeDimensions(4000, 2000, 1000, 1000), { width: 1000, height: 500 });
  assert.deepEqual(resizeDimensions(640, 480, 1920, 1920), { width: 640, height: 480 });
  assert.deepEqual(resizeDimensions(1, 1, 1, 1), { width: 1, height: 1 });
  assert.throws(() => resizeDimensions(0, 50, 100, 100), /geçersiz/i);
});

test('validateImageFile accepts supported formats and rejects unsafe types and sizes', () => {
  assert.equal(validateImageFile(fakeFile('a.jpg', 'image/jpeg')).ok, true);
  assert.equal(validateImageFile(fakeFile('a.PNG', 'image/png')).ok, true);
  assert.equal(validateImageFile(fakeFile('a.webp', '')).ok, true, 'extension may be used when browser MIME is missing');
  assert.equal(validateImageFile(fakeFile('a.svg', 'image/svg+xml')).ok, false);
  assert.equal(validateImageFile(fakeFile('a.jpg', 'image/png')).ok, false, 'extension/MIME mismatch is rejected');
  assert.equal(validateImageFile(fakeFile('a.png', 'image/png', 0)).ok, false);
  assert.equal(validateImageFile(fakeFile('big.webp', 'image/webp', MAX_FILE_BYTES + 1)).ok, false);
});

test('outputName normalizes extensions and strips path-like characters', () => {
  assert.equal(outputName('holiday photo.png', 'image/webp'), 'holiday photo-ortak.webp');
  assert.equal(outputName('../secret:name.jpeg', 'image/jpeg'), '..-secret-name-ortak.jpg');
  assert.equal(outputName('x.png', 'image/png'), 'x-ortak.png');
  assert.equal(outputName('.png', 'image/png'), 'gorsel-ortak.png');
});

test('transparency warning is shown only for JPEG conversion from transparency-capable sources', () => {
  assert.match(transparencyWarning('image/jpeg', 'image/png'), /saydamlığı/i);
  assert.match(transparencyWarning('image/jpeg', 'image/webp'), /saydamlığı/i);
  assert.equal(transparencyWarning('image/jpeg', 'image/jpeg'), '');
  assert.equal(transparencyWarning('image/png', 'image/png'), '');
});

test('safety limits are conservative and explicit', () => {
  assert.equal(MAX_FILE_BYTES, 20 * 1024 * 1024);
  assert.equal(MAX_FILES, 30);
  assert.equal(MAX_BATCH_BYTES, 100 * 1024 * 1024);
  assert.equal(MAX_BATCH_OUTPUT_BYTES, 200 * 1024 * 1024);
  assert.equal(MAX_PIXELS, 16_000_000);
});


test('buildZip produces a valid STORE archive with UTF-8 names and uniqueArchiveName prevents duplicates', async () => {
  const archive = await buildZip([
    { name: 'фото-1.webp', blob: new Blob(['first-bytes'], { type: 'image/webp' }) },
    { name: 'photo-2.jpg', blob: new Blob(['second-bytes'], { type: 'image/jpeg' }) }
  ]);
  const bytes = new Uint8Array(await archive.arrayBuffer());
  const view = new DataView(bytes.buffer);
  assert.equal(archive.type, 'application/zip');
  assert.equal(view.getUint32(0, true), 0x04034b50, 'local file header signature');
  assert.equal(view.getUint32(bytes.byteLength - 22, true), 0x06054b50, 'end of central directory signature');
  assert.equal(view.getUint16(bytes.byteLength - 12, true), 2, 'two files should be listed');
  const seen = new Set();
  assert.equal(uniqueArchiveName('same.webp', seen), 'same.webp');
  assert.equal(uniqueArchiveName('same.webp', seen), 'same-2.webp');
});
