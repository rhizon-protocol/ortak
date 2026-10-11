/* Image worker: receives only one explicitly selected image and fixed transform options. */
const MAX_PIXELS = 16_000_000;
const MAX_SIDE = 12_000;

self.addEventListener('message', /** @param {MessageEvent} event */ async (event) => {
  const message = event.data;
  if (!message || message.type !== 'process') return;
  const { id, buffer, name, settings } = message;
  const startedAt = performance.now();
  let bitmap;
  try {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) throw new Error('Dosya verisi okunamadı.');
    if (typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') throw new Error('Bu tarayıcıda işçi içinde görsel işleme desteklenmiyor.');
    bitmap = await createImageBitmap(new Blob([buffer]));
    if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE || bitmap.width * bitmap.height > MAX_PIXELS) {
      throw new Error('Görsel çok büyük. En fazla 12.000 px kenar ve 16 megapiksel destekleniyor.');
    }
    const scale = Math.min(1, settings.maxWidth / bitmap.width, settings.maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { alpha: settings.format !== 'image/jpeg' });
    if (!context) throw new Error('Görsel çizim alanı açılamadı.');
    if (settings.format === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(bitmap, 0, 0, width, height);
    const output = await canvas.convertToBlob({ type: settings.format, quality: settings.quality });
    if (output.type !== settings.format) throw new Error(`Tarayıcı ${settings.format} biçiminde çıktı üretemedi.`);
    const resultBuffer = await output.arrayBuffer();
    self.postMessage({
      type: 'success', id, name, buffer: resultBuffer, mime: output.type, width, height,
      inputBytes: buffer.byteLength, outputBytes: resultBuffer.byteLength, durationMs: performance.now() - startedAt,
      method: 'Web Worker'
    }, [resultBuffer]);
  } catch (error) {
    self.postMessage({ type: 'failure', id, name, error: error instanceof Error ? error.message : 'Bilinmeyen işleme hatası.', durationMs: performance.now() - startedAt });
  } finally {
    bitmap?.close();
  }
});
