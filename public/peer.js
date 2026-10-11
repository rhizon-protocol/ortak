import { MAX_FILE_BYTES, ALLOWED_MIMES, isRecord, safeDisplayName } from './core.js';

const CHUNK_BYTES = 64 * 1024;
const MAX_BUFFERED_BYTES = 1024 * 1024;
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

function waitForIceGathering(pc, timeoutMs = 15000) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('ICE adayları 15 saniyede tamamlanmadı. STUN hizmeti veya ağ bağlantısı engelleniyor olabilir.'));
    }, timeoutMs);
    const onState = () => {
      if (pc.iceGatheringState === 'complete') { cleanup(); resolve(); }
    };
    const cleanup = () => { clearTimeout(timer); pc.removeEventListener('icegatheringstatechange', onState); };
    pc.addEventListener('icegatheringstatechange', onState);
  });
}

async function digestHex(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseDescription(value, expectedType) {
  let description;
  try { description = JSON.parse(value); } catch { throw new Error('Bağlantı metni geçerli JSON değil. Metnin tamamını kopyaladığından emin ol.'); }
  if (!isRecord(description) || description.type !== expectedType || typeof description.sdp !== 'string' || description.sdp.length > 250_000) {
    throw new Error(`Geçerli bir WebRTC ${expectedType} metni bulunamadı.`);
  }
  return description;
}

export class PeerSession {
  constructor(callbacks = {}) {
    this.callbacks = callbacks;
    this.pc = null;
    this.channel = null;
    this.role = null;
    this.incomingTransfer = null;
    this.pendingOffer = null;
    this.pendingResult = null;
    this.lastTransferBytesSent = 0;
    this.lastTransferBytesReceived = 0;
    this._closeAfterJob = false;
  }

  setState(state, detail = '') { this.callbacks.onState?.(state, detail); }

  async setup(role) {
    this.close(false);
    if (typeof RTCPeerConnection === 'undefined') throw new Error('Bu tarayıcı WebRTC bağlantısını desteklemiyor.');
    if (!globalThis.isSecureContext) throw new Error('WebRTC için HTTPS veya localhost üzerinde açmalısın.');
    this.role = role;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc.addEventListener('connectionstatechange', () => {
      const state = this.pc?.connectionState ?? 'closed';
      this.setState(state, state === 'connected' ? 'Cihazlar doğrudan bağlandı.' : state === 'failed' ? 'Bağlantı kurulamadı. Ağ, güvenlik duvarı veya NAT engelliyor olabilir.' : state === 'disconnected' ? 'Bağlantı kesildi; yeniden kurulmayı bekliyor.' : '');
      if (state === 'failed') this.callbacks.onFailure?.('WebRTC bağlantısı başarısız oldu. Aynı ağda deneyin veya ağ kısıtlarını kontrol edin.');
    });
    this.pc.addEventListener('iceconnectionstatechange', () => {
      if (this.pc?.iceConnectionState === 'failed') this.callbacks.onFailure?.('ICE bağlantı kontrolü başarısız oldu. TURN sunucusu kullanılmadığı için bu ağda bağlantı mümkün olmayabilir.');
    });
    this.pc.addEventListener('datachannel', (event) => this.attachChannel(event.channel));
    return this.pc;
  }

  attachChannel(channel) {
    this.channel = channel;
    channel.binaryType = 'arraybuffer';
    channel.bufferedAmountLowThreshold = 256 * 1024;
    channel.addEventListener('open', () => this.setState('connected', 'Şifreli DataChannel açık.'));
    channel.addEventListener('close', () => this.setState('disconnected', 'Veri kanalı kapandı.'));
    channel.addEventListener('error', () => this.callbacks.onFailure?.('Veri kanalı hatası oluştu.'));
    channel.addEventListener('message', (event) => { void this.handleMessage(event.data); });
  }

  async createOffer() {
    const pc = await this.setup('offerer');
    this.attachChannel(pc.createDataChannel('ortak-task-v1', { ordered: true }));
    this.setState('connecting', 'Bağlantı daveti oluşturuluyor…');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await waitForIceGathering(pc);
    return JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
  }

  async createAnswer(offerText) {
    const pc = await this.setup('answerer');
    const offer = parseDescription(offerText, 'offer');
    this.setState('connecting', 'Davet kontrol ediliyor…');
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await waitForIceGathering(pc);
    this.setState('waiting', 'Yanıt hazır. Metni ilk cihaza gönder.');
    return JSON.stringify({ type: pc.localDescription.type, sdp: pc.localDescription.sdp });
  }

  async acceptAnswer(answerText) {
    if (!this.pc || this.role !== 'offerer') throw new Error('Önce bu cihazda bir bağlantı daveti oluştur.');
    const answer = parseDescription(answerText, 'answer');
    await this.pc.setRemoteDescription(answer);
    this.setState('connecting', 'Yanıt alındı. Eş cihazla bağlantı kuruluyor…');
  }

  connected() { return this.channel?.readyState === 'open' && this.pc?.connectionState === 'connected'; }

  sendControl(message) {
    if (!this.connected()) throw new Error('Bağlı bir eş cihaz yok. Önce WebRTC bağlantısını kur.');
    this.channel.send(JSON.stringify(message));
  }

  async sendWorkJob(item, settings) {
    if (!this.connected()) throw new Error('Bağlı bir eş cihaz yok.');
    if (this.pendingResult) throw new Error('Önce devam eden aktarımın bitmesini bekle.');
    const extension = item.file.name.split('.').pop()?.toLowerCase();
    const sourceMime = item.file.type || (extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '');
    const validMime = ALLOWED_MIMES.has(sourceMime);
    if (!validMime || item.file.size > MAX_FILE_BYTES) throw new Error('Yalnızca en fazla 20 MB JPEG, PNG veya WebP gönderilebilir.');
    const id = crypto.randomUUID();
    this.lastTransferBytesSent = 0;
    this.lastTransferBytesReceived = 0;
    const startAt = performance.now();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingResult = null;
        reject(new Error('Karşı cihaz zamanında yanıt vermedi. Bağlantıyı ve onay durumunu kontrol et.'));
      }, 180_000);
      this.pendingResult = { id, resolve, reject, timer, startAt, phase: 'consent', fileName: item.file.name, file: item.file };
      try {
        this.sendControl({ type: 'job-offer', id, name: safeDisplayName(item.file.name), size: item.file.size, mime: sourceMime, settings });
      } catch (error) {
        clearTimeout(timer); this.pendingResult = null; reject(error);
      }
    });
  }

  async acceptJob(id) {
    if (!this.pendingOffer || this.pendingOffer.id !== id) throw new Error('Bu iş artık beklemede değil.');
    this.sendControl({ type: 'job-consent', id });
    this.callbacks.onProgress?.('Onay verildi. Fotoğraf aktarılıyor…');
  }

  rejectJob(id) {
    if (!this.pendingOffer || this.pendingOffer.id !== id) return;
    this.sendControl({ type: 'job-reject', id });
    this.pendingOffer = null;
    this.callbacks.onIncomingJob?.(null);
  }

  async sendResult(id, result) {
    const buffer = await result.blob.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_BYTES) throw new Error('Dönüştürülen sonuç 20 MB sınırını aşıyor.');
    const hash = await digestHex(buffer);
    const meta = {
      type: 'result-start', id, size: buffer.byteLength, sha256: hash,
      mime: result.mime, name: safeDisplayName(result.name), width: result.width, height: result.height,
      durationMs: result.durationMs, method: result.method ?? 'Web Worker'
    };
    this.sendControl(meta);
    await this.sendBinary(buffer);
    this.sendControl({ type: 'result-end', id });
    this.lastTransferBytesSent += buffer.byteLength;
    this.callbacks.onProgress?.('Sonuç karşı cihaza gönderildi.');
  }

  async sendBinary(buffer) {
    for (let offset = 0; offset < buffer.byteLength; offset += CHUNK_BYTES) {
      if (!this.connected()) throw new Error('Dosya aktarılırken bağlantı kesildi.');
      if (this.channel.bufferedAmount > MAX_BUFFERED_BYTES) {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => { cleanup(); reject(new Error('Veri kanalı yavaşladı; aktarım durduruldu.')); }, 30_000);
          const cleanup = () => { clearTimeout(timeout); this.channel.removeEventListener('bufferedamountlow', onLow); this.channel.removeEventListener('close', onClose); };
          const onLow = () => { cleanup(); resolve(); };
          const onClose = () => { cleanup(); reject(new Error('Aktarım sırasında bağlantı kapandı.')); };
          this.channel.addEventListener('bufferedamountlow', onLow, { once: true });
          this.channel.addEventListener('close', onClose, { once: true });
        });
      }
      const part = buffer.slice(offset, Math.min(offset + CHUNK_BYTES, buffer.byteLength));
      this.channel.send(part);
      this.lastTransferBytesSent += part.byteLength;
      this.callbacks.onProgress?.(`Veri gönderiliyor: %${Math.min(100, Math.round((offset + part.byteLength) / buffer.byteLength * 100))}`);
    }
  }

  async handleMessage(data) {
    if (typeof data !== 'string') {
      const buffer = data instanceof ArrayBuffer ? data : data instanceof Blob ? await data.arrayBuffer() : null;
      if (!buffer || !this.incomingTransfer) return;
      this.incomingTransfer.chunks.push(buffer);
      this.incomingTransfer.received += buffer.byteLength;
      if (this.incomingTransfer.received > this.incomingTransfer.size || this.incomingTransfer.received > MAX_FILE_BYTES) {
        this.sendControl({ type: 'job-error', id: this.incomingTransfer.id, error: 'Gelen veri izin verilen dosya sınırını aştı.' });
        this.incomingTransfer = null;
        return;
      }
      this.callbacks.onProgress?.(`Veri alınıyor: ${Math.min(this.incomingTransfer.received, this.incomingTransfer.size).toLocaleString('tr-TR')} / ${this.incomingTransfer.size.toLocaleString('tr-TR')} bayt`);
      return;
    }
    let message;
    try { message = JSON.parse(data); } catch { this.callbacks.onFailure?.('Eş cihazdan geçersiz bir mesaj geldi.'); return; }
    if (!isRecord(message) || typeof message.type !== 'string') return;
    try {
      switch (message.type) {
        case 'job-offer': {
          if (typeof message.id !== 'string' || typeof message.name !== 'string' || !Number.isSafeInteger(message.size) || message.size < 1 || message.size > MAX_FILE_BYTES || !ALLOWED_MIMES.has(message.mime) || !isRecord(message.settings)) {
            this.sendControl({ type: 'job-reject', id: message.id, reason: 'Bu işin türü veya boyutu desteklenmiyor.' }); return;
          }
          if (this.pendingOffer || this.incomingTransfer || this.pendingResult) {
            this.sendControl({ type: 'job-reject', id: message.id, reason: 'Bu cihazda başka bir iş sürüyor.' }); return;
          }
          this.pendingOffer = { id: message.id, name: safeDisplayName(message.name), size: message.size, mime: message.mime, settings: message.settings };
          this.callbacks.onIncomingJob?.(this.pendingOffer);
          break;
        }
        case 'job-consent': {
          if (!this.pendingResult || this.pendingResult.id !== message.id || this.pendingResult.phase !== 'consent') return;
          this.pendingResult.phase = 'transfer';
          await this.sendInputFile(this.pendingResult.id);
          break;
        }
        case 'job-reject': {
          if (this.pendingResult && this.pendingResult.id === message.id) {
            clearTimeout(this.pendingResult.timer);
            this.pendingResult.reject(new Error(message.reason || 'Karşı cihaz işi kabul etmedi.'));
            this.pendingResult = null;
          }
          this.callbacks.onProgress?.(message.reason || 'Karşı cihaz işi reddetti.');
          break;
        }
        case 'file-start': {
          if (!this.pendingOffer || this.pendingOffer.id !== message.id || !Number.isSafeInteger(message.size) || message.size !== this.pendingOffer.size || message.size < 1 || message.size > MAX_FILE_BYTES || typeof message.sha256 !== 'string') return;
          this.incomingTransfer = { kind: 'input', id: message.id, size: message.size, sha256: message.sha256, chunks: [], received: 0, offer: this.pendingOffer };
          break;
        }
        case 'file-end': {
          const transfer = this.incomingTransfer;
          if (!transfer || transfer.kind !== 'input' || transfer.id !== message.id) return;
          this.incomingTransfer = null;
          if (transfer.received !== transfer.size) { this.sendControl({ type: 'job-error', id: transfer.id, error: 'Fotoğraf aktarımı eksik kaldı.' }); return; }
          const buffer = new Uint8Array(transfer.received);
          let offset = 0;
          for (const chunk of transfer.chunks) { buffer.set(new Uint8Array(chunk), offset); offset += chunk.byteLength; }
          const actualHash = await digestHex(buffer.buffer);
          if (actualHash !== transfer.sha256) { this.sendControl({ type: 'job-error', id: transfer.id, error: 'Dosya özeti eşleşmedi; aktarım güvenlik için reddedildi.' }); return; }
          this.pendingOffer = null;
          this.lastTransferBytesReceived = buffer.byteLength;
          this.callbacks.onProgress?.('Dosya alındı ve SHA-256 özeti doğrulandı. İşleniyor…');
          await this.callbacks.onIncomingFile?.({ id: transfer.id, offer: transfer.offer, blob: new Blob([buffer], { type: transfer.offer.mime }), inputSha256: actualHash });
          break;
        }
        case 'result-start': {
          if (!this.pendingResult || this.pendingResult.id !== message.id || !Number.isSafeInteger(message.size) || message.size < 1 || message.size > MAX_FILE_BYTES || typeof message.sha256 !== 'string' || !ALLOWED_MIMES.has(message.mime)) return;
          this.incomingTransfer = { kind: 'result', id: message.id, size: message.size, sha256: message.sha256, chunks: [], received: 0, meta: message };
          break;
        }
        case 'result-end': {
          const transfer = this.incomingTransfer;
          if (!transfer || transfer.kind !== 'result' || transfer.id !== message.id || !this.pendingResult || this.pendingResult.id !== message.id) return;
          this.incomingTransfer = null;
          if (transfer.received !== transfer.size) throw new Error('Dönen sonuç dosyası eksik kaldı.');
          const buffer = new Uint8Array(transfer.received);
          let offset = 0;
          for (const chunk of transfer.chunks) { buffer.set(new Uint8Array(chunk), offset); offset += chunk.byteLength; }
          const actualHash = await digestHex(buffer.buffer);
          if (actualHash !== transfer.sha256) throw new Error('Dönen sonucun SHA-256 özeti eşleşmedi.');
          clearTimeout(this.pendingResult.timer);
          const pending = this.pendingResult;
          this.pendingResult = null;
          this.lastTransferBytesReceived = buffer.byteLength;
          const elapsedMs = performance.now() - pending.startAt;
          pending.resolve({ blob: new Blob([buffer], { type: transfer.meta.mime }), meta: transfer.meta, transferMs: elapsedMs, sentBytes: this.lastTransferBytesSent, receivedBytes: this.lastTransferBytesReceived });
          this.callbacks.onProgress?.(`Sonuç geldi. Toplam uçtan uca süre: ${(elapsedMs / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} sn.`);
          break;
        }
        case 'job-error': {
          if (this.pendingResult && this.pendingResult.id === message.id) {
            clearTimeout(this.pendingResult.timer);
            this.pendingResult.reject(new Error(message.error || 'Karşı cihaz işi tamamlayamadı.'));
            this.pendingResult = null;
          }
          this.callbacks.onProgress?.(message.error || 'Karşı cihaz işi tamamlayamadı.');
          break;
        }
      }
    } catch (error) {
      this.callbacks.onFailure?.(error instanceof Error ? error.message : 'Eşler arası işlem hatası.');
      const id = this.pendingResult?.id;
      if (id) { clearTimeout(this.pendingResult.timer); this.pendingResult.reject(error); this.pendingResult = null; }
      if (message.id) { try { this.sendControl({ type: 'job-error', id: message.id, error: error instanceof Error ? error.message : 'İşlem başarısız.' }); } catch {} }
    }
  }

  async sendInputFile(id) {
    const pending = this.pendingResult;
    if (!pending || pending.id !== id) throw new Error('Bekleyen iş bulunamadı.');
    const buffer = await pending.file.arrayBuffer();
    const hash = await digestHex(buffer);
    this.sendControl({ type: 'file-start', id, size: buffer.byteLength, sha256: hash });
    await this.sendBinary(buffer);
    this.sendControl({ type: 'file-end', id });
    this.callbacks.onProgress?.('Fotoğraf karşı cihaza gönderildi. İşlenmesi bekleniyor…');
  }

  close(notify = true) {
    if (this.pendingResult) {
      clearTimeout(this.pendingResult.timer);
      this.pendingResult.reject(new Error('Bağlantı kapatıldı.'));
      this.pendingResult = null;
    }
    this.incomingTransfer = null;
    this.pendingOffer = null;
    if (this.channel) { try { this.channel.close(); } catch {} }
    if (this.pc) { try { this.pc.close(); } catch {} }
    this.channel = null;
    this.pc = null;
    this.role = null;
    if (notify) this.setState('closed', 'Bağlantı kapatıldı.');
  }
}
