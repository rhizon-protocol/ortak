import { formatBytes, savedPercent, outputName, validateImageFile, transparencyWarning, MAX_FILES, MAX_FILE_BYTES, MAX_BATCH_BYTES, MAX_BATCH_OUTPUT_BYTES, MAX_PIXELS, MAX_SIDE, ALLOWED_MIMES } from './core.js';
import { PeerSession } from './peer.js';
import { buildZip, uniqueArchiveName } from './zip.js';

const $ = (selector) => document.querySelector(selector);
const elements = {
  fileInput: $('#file-input'), choose: $('#choose-files'), drop: $('#drop-zone'), fileList: $('#file-list'), fileCount: $('#file-count'),
  format: $('#format-select'), width: $('#max-width'), height: $('#max-height'), quality: $('#quality-range'), qualityValue: $('#quality-value'),
  workerCount: $('#worker-count'), process: $('#process-button'), cancel: $('#cancel-button'), status: $('#operation-status'),
  transparency: $('#transparency-warning'), results: $('#results-section'), resultList: $('#result-list'), stats: $('#summary-stats'), downloadAll: $('#download-all'),
  benchmarkSingle: $('#benchmark-single'), benchmarkMulti: $('#benchmark-multi'), benchmarkWorkerLabel: $('#benchmark-worker-label'), benchmarkResults: $('#benchmark-results'), benchmarkTable: $('#benchmark-table'), clearBenchmark: $('#clear-benchmark'),
  peerPanel: $('#peer-panel'), openPeer: $('#open-peer'), closePeer: $('#close-peer'), createOffer: $('#create-offer'), offerOutput: $('#offer-output'), offerInput: $('#offer-input'), createAnswer: $('#create-answer'), answerOutput: $('#answer-output'), answerInput: $('#answer-input'), connectPeer: $('#connect-peer'), peerState: $('#peer-state'), peerControls: $('#peer-job-controls'), peerFileSelect: $('#peer-file-select'), sendPeerJob: $('#send-peer-job'), incomingJob: $('#incoming-job'), peerProgress: $('#peer-progress')
};

/** @typedef {{id:string,file:File,valid:boolean,error:string,status:string,outputBlob?:Blob,outputUrl?:string,previewUrl?:string,resultName?:string,width?:number,height?:number,inputBytes?:number,outputBytes?:number,durationMs?:number,method?:string,transferMs?:number,sentBytes?:number,receivedBytes?:number}} ImageItem */
/** @type {ImageItem[]} */
let items = [];
let running = false;
let runId = 0;
/** @type {{worker:Worker,cancel:()=>void}[]} */
let activeWorkers = [];
/** @type {{label:string,elapsedMs:number,success:number,failed:number,transferBytes:number,taskCount:number,at:string}[]} */
let benchmarkRows = [];
let peer = null;
let peerIncomingSettings = null;
let peerIncomingId = null;
let swRegistered = false;

function makeId() { return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function announce(message, error = false) { elements.status.textContent = message; elements.status.classList.toggle('error', error); }
function peerAnnounce(message) { elements.peerProgress.textContent = message; }
function fmtDuration(ms) { return `${(ms / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 })} sn`; }
function inferMime(file) {
  if (file.type) return file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  return extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : '';
}
function settingsFromUI() {
  const maxWidth = Number(elements.width.value); const maxHeight = Number(elements.height.value);
  if (!Number.isInteger(maxWidth) || !Number.isInteger(maxHeight) || maxWidth < 1 || maxHeight < 1 || maxWidth > MAX_SIDE || maxHeight > MAX_SIDE) throw new Error('Genişlik ve yükseklik 1 ile 12.000 px arasında tam sayı olmalı.');
  return { format: elements.format.value, maxWidth, maxHeight, quality: Number(elements.quality.value) / 100 };
}
function normalizeRemoteSettings(raw) {
  if (!raw || !ALLOWED_MIMES.has(raw.format) || !Number.isInteger(raw.maxWidth) || !Number.isInteger(raw.maxHeight) || raw.maxWidth < 1 || raw.maxHeight < 1 || raw.maxWidth > MAX_SIDE || raw.maxHeight > MAX_SIDE || typeof raw.quality !== 'number' || raw.quality < 0.4 || raw.quality > 1) throw new Error('Gönderilen iş ayarları geçerli değil.');
  return raw;
}
function setProcessingUI(active) {
  running = active;
  elements.process.hidden = active;
  elements.cancel.hidden = !active;
  elements.process.disabled = active || !items.some((item) => item.valid);
  [elements.benchmarkSingle, elements.benchmarkMulti, elements.sendPeerJob].forEach((button) => { if (button) button.disabled = active || (button === elements.sendPeerJob && !peer?.connected()); });
  elements.choose.disabled = active;
  elements.drop.setAttribute('aria-disabled', String(active));
}
function clearResult(item) {
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  item.outputUrl = undefined; item.outputBlob = undefined; item.resultName = undefined;
}
function createFileItem(file) {
  const validation = validateImageFile(file);
  return { id: makeId(), file, previewUrl: validation.ok ? URL.createObjectURL(file) : undefined, valid: validation.ok, error: validation.reason, status: validation.ok ? 'Hazır' : validation.reason };
}
function addFiles(fileList) {
  const incoming = Array.from(fileList ?? []);
  if (!incoming.length) return;
  const remaining = Math.max(0, MAX_FILES - items.length);
  const accepted = incoming.slice(0, remaining);
  let batchBytes = items.reduce((total, item) => total + (item.valid ? item.file.size : 0), 0);
  accepted.forEach((file) => {
    const item = createFileItem(file);
    if (item.valid && batchBytes + file.size > MAX_BATCH_BYTES) { item.valid = false; item.error = 'Seçilen kaynak dosyalar toplam 100 MB sınırını aşıyor.'; item.status = item.error; }
    else if (item.valid) batchBytes += file.size;
    items.push(item);
  });
  if (accepted.length < incoming.length) announce(`Bir oturumda en fazla ${MAX_FILES} dosya eklenebilir. ${incoming.length - accepted.length} dosya eklenmedi.`, true);
  else if (items.length) announce('Dosyalar hazır. Toplam kaynak dosya sınırı 100 MB. Ayarlarını belirleyip işleme başlayabilirsin.');
  renderFiles(); updateControls(); updatePeerFileSelect();
  elements.fileInput.value = '';
}
function removeItem(id) {
  const item = items.find((candidate) => candidate.id === id);
  if (item) { clearResult(item); if (item.previewUrl) URL.revokeObjectURL(item.previewUrl); items = items.filter((candidate) => candidate.id !== id); }
  renderFiles(); renderResults(); updateControls(); updatePeerFileSelect();
}
function renderFiles() {
  elements.fileList.replaceChildren();
  for (const item of items) {
    const row = document.createElement('div'); row.className = 'file-item';
    const thumb = document.createElement('img'); thumb.className = 'file-thumb'; thumb.alt = ''; thumb.src = item.outputUrl || item.previewUrl || './icon.svg';
    const details = document.createElement('div'); details.className = 'file-detail';
    const name = document.createElement('strong'); name.textContent = item.file.name;
    const meta = document.createElement('small'); meta.textContent = `${formatBytes(item.file.size)} · ${inferMime(item.file) || 'Bilinmeyen biçim'}`;
    details.append(name, meta);
    const status = document.createElement('span'); status.className = `file-status${item.status.startsWith('Hata') || !item.valid ? ' error' : ''}`; status.textContent = item.status;
    const remove = document.createElement('button'); remove.className = 'remove-file'; remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `${item.file.name} dosyasını kaldır`); remove.disabled = running; remove.addEventListener('click', () => removeItem(item.id));
    row.append(thumb, details, status, remove); elements.fileList.append(row);
  }
  elements.fileCount.textContent = `${items.length} dosya`;
}
function updateControls() {
  elements.process.disabled = running || !items.some((item) => item.valid);
  elements.choose.disabled = running;
  elements.drop.setAttribute('aria-disabled', String(running));
  elements.benchmarkWorkerLabel.textContent = `${effectiveWorkerCount(Number(elements.workerCount.value), Math.max(1, items.filter((item) => item.valid).length))} işçi`;
  const isJpeg = elements.format.value === 'image/jpeg';
  elements.transparency.hidden = !isJpeg || !items.some((item) => inferMime(item.file) === 'image/png' || inferMime(item.file) === 'image/webp');
  elements.sendPeerJob.disabled = !peer?.connected() || running || !items.some((item) => item.valid);
}
function updatePeerFileSelect() {
  const previous = elements.peerFileSelect.value;
  elements.peerFileSelect.replaceChildren();
  for (const item of items.filter((candidate) => candidate.valid)) {
    const option = document.createElement('option'); option.value = item.id; option.textContent = `${item.file.name} · ${formatBytes(item.file.size)}`; elements.peerFileSelect.append(option);
  }
  if ([...elements.peerFileSelect.options].some((option) => option.value === previous)) elements.peerFileSelect.value = previous;
  elements.sendPeerJob.disabled = !peer?.connected() || !items.some((item) => item.valid);
}
function showResults() {
  const successes = items.filter((item) => item.outputBlob);
  const failures = items.filter((item) => !item.valid || item.status.startsWith('Hata'));
  elements.results.hidden = successes.length === 0 && failures.length === 0;
  elements.resultList.replaceChildren();
  elements.downloadAll.disabled = successes.length === 0;
  const originalBytes = successes.reduce((sum, item) => sum + (item.inputBytes ?? item.file.size), 0);
  const outputBytes = successes.reduce((sum, item) => sum + (item.outputBytes ?? item.outputBlob.size), 0);
  elements.stats.replaceChildren();
  const stats = [
    ['Tamamlanan', `${successes.length} / ${items.filter((item) => item.valid).length}`],
    ['Toplam kazanım', outputBytes <= originalBytes ? formatBytes(originalBytes - outputBytes) : `${formatBytes(outputBytes - originalBytes)} artış`],
    ['Boyut farkı', `${savedPercent(originalBytes, outputBytes)}%`]
  ];
  stats.forEach(([label, value]) => { const box = document.createElement('div'); box.className = 'summary-stat'; const small = document.createElement('span'); small.textContent = label; const strong = document.createElement('strong'); strong.textContent = value; box.append(small, strong); elements.stats.append(box); });
  for (const item of items.filter((candidate) => candidate.outputBlob || candidate.status.startsWith('Hata') || !candidate.valid)) {
    const row = document.createElement('div'); row.className = 'result-item';
    const thumb = document.createElement('img'); thumb.className = 'result-thumb'; thumb.alt = ''; thumb.src = item.outputUrl || './icon.svg';
    const body = document.createElement('div'); body.className = 'result-body'; const name = document.createElement('strong'); name.textContent = item.outputBlob ? (item.resultName || outputName(item.file.name, item.outputBlob.type)) : item.file.name; body.append(name);
    const info = document.createElement('p');
    if (item.outputBlob) {
      const change = item.outputBytes <= item.inputBytes ? `${formatBytes(item.inputBytes - item.outputBytes)} küçüldü (${savedPercent(item.inputBytes, item.outputBytes)}%)` : `${formatBytes(item.outputBytes - item.inputBytes)} büyüdü`;
      info.textContent = `${formatBytes(item.inputBytes)} → ${formatBytes(item.outputBytes)} · ${item.width} × ${item.height} px · ${fmtDuration(item.durationMs ?? 0)}`; body.append(info);
      const metrics = document.createElement('div'); metrics.className = 'result-metrics'; const saving = document.createElement('span'); saving.textContent = change; const method = document.createElement('span'); method.textContent = item.method || 'Yerel'; metrics.append(saving, method); body.append(metrics);
    } else { info.textContent = item.error || item.status; info.className = 'error'; body.append(info); }
    let action;
    if (item.outputBlob) { const button = document.createElement('button'); button.className = 'download-one'; button.type = 'button'; button.textContent = 'İndir ↓'; button.addEventListener('click', () => downloadBlob(item.outputBlob, item.resultName || 'ortak-sonuc.webp')); action = button; }
    else { const badge = document.createElement('span'); badge.className = 'file-status error'; badge.textContent = 'Başarısız'; action = badge; }
    row.append(thumb, body, action); elements.resultList.append(row);
  }
}
function renderResults() { showResults(); }
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.style.display = 'none'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
async function processOnMainThread(file, settings) {
  const started = performance.now(); let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    if (bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE || bitmap.width * bitmap.height > MAX_PIXELS) throw new Error('Görsel çok büyük. En fazla 12.000 px kenar ve 16 megapiksel destekleniyor.');
    const scale = Math.min(1, settings.maxWidth / bitmap.width, settings.maxHeight / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * scale)); const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d', { alpha: settings.format !== 'image/jpeg' });
    if (!context) throw new Error('Tarayıcı görsel alanı oluşturamadı.');
    if (settings.format === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, width, height); }
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error('Tarayıcı çıktı görselini kaydedemedi.')), settings.format, settings.quality));
    if (blob.type !== settings.format) throw new Error(`Tarayıcı ${settings.format} biçiminde çıktı üretemedi.`);
    return { blob, mime: blob.type, width, height, durationMs: performance.now() - started, method: 'Ana iş parçacığı (yedek)' };
  } finally { bitmap?.close(); }
}
function processOnWorker(worker, item, settings, token, workerEntry) {
  return new Promise(async (resolve, reject) => {
    let finished = false;
    const cleanup = () => { worker.removeEventListener('message', onMessage); worker.removeEventListener('error', onError); };
    const done = (fn, value) => { if (finished) return; finished = true; cleanup(); resolveOrReject(fn, value); };
    const resolveOrReject = (fn, value) => fn === resolve ? resolve(value) : reject(value);
    const onMessage = (event) => {
      if (token !== runId) return done(resolve, { cancelled: true });
      if (event.data.id !== item.id) return;
      if (event.data.type === 'failure') done(reject, new Error(event.data.error));
      else done(resolve, { ...event.data, blob: new Blob([event.data.buffer], { type: event.data.mime }) });
    };
    const onError = (event) => done(reject, new Error(event.message || 'İşçi beklenmeyen bir hatayla durdu.'));
    if (workerEntry) workerEntry.cancel = () => done(resolve, { cancelled: true });
    worker.addEventListener('message', onMessage); worker.addEventListener('error', onError);
    const buffer = await item.file.arrayBuffer();
    if (token !== runId) return done(resolve, { cancelled: true });
    try { worker.postMessage({ type: 'process', id: item.id, name: item.file.name, buffer, settings }, [buffer]); }
    catch (error) { done(reject, error); }
  });
}
function effectiveWorkerCount(requested, taskCount) {
  const memory = Number(/** @type {Navigator & {deviceMemory?: number}} */ (navigator).deviceMemory || 4);
  const hardware = Number(navigator.hardwareConcurrency || 2);
  const safeCap = memory <= 2 ? 1 : memory <= 4 ? Math.min(2, Math.max(1, hardware - 1)) : Math.min(4, Math.max(1, hardware - 1));
  return Math.max(1, Math.min(requested || 1, safeCap, taskCount || 1, 4));
}
function setItemOutput(item, output, settings, methodOverride) {
  clearResult(item);
  const otherOutputBytes = items.filter((candidate) => candidate !== item && candidate.outputBlob).reduce((total, candidate) => total + candidate.outputBlob.size, 0);
  if (otherOutputBytes + output.blob.size > MAX_BATCH_OUTPUT_BYTES) throw new Error('Sonuçların toplamı 200 MB sınırını aşacağı için bu çıktı saklanmadı. Daha küçük ölçü/biçim seç veya bazı sonuçları kaldır.');
  item.outputBlob = output.blob;
  item.outputUrl = URL.createObjectURL(output.blob);
  item.resultName = outputName(item.file.name, output.blob.type);
  item.width = output.width; item.height = output.height;
  item.inputBytes = item.file.size; item.outputBytes = output.blob.size;
  item.durationMs = output.durationMs; item.method = methodOverride || output.method || 'Web Worker';
  item.status = 'Tamamlandı'; item.error = '';
}
async function runLocal(ids, requestedWorkers, label = '') {
  if (running) return null;
  let settings;
  try { settings = settingsFromUI(); } catch (error) { announce(error.message, true); return null; }
  const taskItems = ids.map((id) => items.find((item) => item.id === id)).filter((item) => item?.valid);
  if (!taskItems.length) { announce('Önce geçerli bir fotoğraf ekle.', true); return null; }
  const thisRun = ++runId; const started = performance.now();
  const concurrency = effectiveWorkerCount(requestedWorkers, taskItems.length);
  const canWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
  setProcessingUI(true); announce(label ? `${label}: ${taskItems.length} görev başlatıldı…` : `${taskItems.length} fotoğraf ${concurrency} işçiyle işleniyor…`);
  taskItems.forEach((item) => { item.status = 'Sırada'; item.error = ''; }); renderFiles();
  let cursor = 0; let completed = 0; let succeeded = 0; let failed = 0; let workerFailure = false;
  const runSlot = async () => {
    let worker = null;
    if (canWorker) {
      try {
        worker = new Worker(new URL('./image-worker.js', import.meta.url), { type: 'module' });
        const entry = { worker, cancel: () => {} }; activeWorkers.push(entry);
      } catch { worker = null; }
    }
    while (thisRun === runId) {
      const next = cursor++;
      if (next >= taskItems.length) break;
      const item = taskItems[next]; item.status = 'İşleniyor'; renderFiles();
      try {
        let output;
        if (worker) {
          try { output = await processOnWorker(worker, item, settings, thisRun, activeWorkers.find((entry) => entry.worker === worker)); }
          catch (error) {
            workerFailure = true;
            worker.terminate(); worker = null;
            output = await processOnMainThread(item.file, settings);
            if (thisRun === runId) announce(`Bir işçide sorun oluştu; bu görev güvenli biçimde ana iş parçacığında tamamlandı.`, false);
          }
        } else output = await processOnMainThread(item.file, settings);
        if (thisRun !== runId || output?.cancelled) break;
        setItemOutput(item, output, settings, workerFailure && output.method === 'Ana iş parçacığı (yedek)' ? output.method : undefined); succeeded += 1;
      } catch (error) {
        if (thisRun !== runId) break;
        clearResult(item); item.status = 'Hata'; item.error = error instanceof Error ? error.message : 'İşlem başarısız.'; failed += 1;
      }
      completed += 1; announce(`${label || 'Fotoğraf işleme'} · ${completed}/${taskItems.length} tamamlandı (${succeeded} başarılı, ${failed} hatalı).`); renderFiles(); showResults();
    }
    if (worker) { worker.terminate(); activeWorkers = activeWorkers.filter((entry) => entry.worker !== worker); }
  };
  await Promise.all(Array.from({ length: concurrency }, () => runSlot()));
  if (thisRun !== runId) return null;
  activeWorkers.forEach((entry) => entry.worker.terminate()); activeWorkers = [];
  const elapsedMs = performance.now() - started;
  setProcessingUI(false); renderFiles(); showResults(); updateControls(); updatePeerFileSelect();
  announce(`Tamamlandı: ${succeeded} başarılı, ${failed} hatalı · toplam ${fmtDuration(elapsedMs)}.` , failed > 0 && succeeded === 0);
  return { label: label || (concurrency === 1 ? 'Yerel · tek işçi' : `Yerel · ${concurrency} işçi`), elapsedMs, success: succeeded, failed, transferBytes: 0, taskCount: taskItems.length, at: new Date().toISOString() };
}
function addBenchmark(row) {
  benchmarkRows.push(row); elements.benchmarkResults.hidden = false; elements.benchmarkTable.replaceChildren();
  benchmarkRows.forEach((result) => {
    const tr = document.createElement('tr'); const values = [result.label, fmtDuration(result.elapsedMs), `${result.success}/${result.taskCount}`, String(result.failed), result.transferBytes ? formatBytes(result.transferBytes) : '—'];
    values.forEach((value) => { const td = document.createElement('td'); td.textContent = value; tr.append(td); }); elements.benchmarkTable.append(tr);
  });
}

function renderIncomingOffer(offer) {
  elements.incomingJob.replaceChildren(); elements.incomingJob.hidden = !offer;
  if (!offer) { peerIncomingId = null; peerIncomingSettings = null; return; }
  peerIncomingId = offer.id; peerIncomingSettings = offer.settings;
  const title = document.createElement('strong'); title.textContent = 'Karşı cihaz bir iş gönderiyor';
  const description = document.createElement('p'); description.textContent = `“${offer.name}” adlı ${formatBytes(offer.size)} dosya, ${offer.mime} biçiminde. Dosyanın içeriği bu cihazda görülebilir. İzin verirsen seçilen fotoğraf bu cihaza aktarılacak ve burada işlenip geri gönderilecek.`;
  const actions = document.createElement('div'); actions.className = 'incoming-actions';
  const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'primary-button'; accept.textContent = 'Kabul et ve işle';
  const reject = document.createElement('button'); reject.type = 'button'; reject.className = 'danger-button'; reject.textContent = 'Reddet';
  accept.addEventListener('click', async () => { accept.disabled = true; reject.disabled = true; try { await peer.acceptJob(offer.id); peerAnnounce('İş onaylandı; dosya aktarımı bekleniyor…'); } catch (error) { peerAnnounce(error.message); accept.disabled = false; reject.disabled = false; } });
  reject.addEventListener('click', () => { peer?.rejectJob(offer.id); peerAnnounce('İş reddedildi.'); renderIncomingOffer(null); });
  actions.append(accept, reject); elements.incomingJob.append(title, description, actions); elements.incomingJob.hidden = false;
}

function setPeerState(state, detail = '') {
  elements.peerState.textContent = detail || (state === 'connected' ? 'Bağlandı: doğrudan WebRTC veri kanalı açık.' : state === 'failed' ? 'Bağlantı başarısız.' : state === 'connecting' ? 'Bağlanıyor…' : state === 'closed' ? 'Bağlantı kurulmadı.' : 'Bağlantı bekleniyor…');
  elements.peerState.classList.toggle('connected', state === 'connected'); elements.peerState.classList.toggle('error', state === 'failed');
  if (state === 'connected') { elements.peerControls.hidden = false; elements.peerProgress.textContent = 'Bağlantı kuruldu. Bir görev seçip gönderebilirsin.'; }
  if (['failed', 'closed'].includes(state)) { elements.peerControls.hidden = true; }
  elements.sendPeerJob.disabled = !peer?.connected() || running || !items.some((item) => item.valid);
}
async function processIncomingPeerFile(task) {
  let settings;
  try {
    settings = normalizeRemoteSettings(task.offer.settings);
    const mime = task.offer.mime;
    if (!ALLOWED_MIMES.has(mime) || task.blob.size > MAX_FILE_BYTES) throw new Error('Gelen dosya türü veya boyutu desteklenmiyor.');
    peerAnnounce('Fotoğraf karşı cihazdan alındı. Yerel işleme başlıyor…');
    const file = new File([task.blob], task.offer.name, { type: mime });
    let output;
    const canWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function';
    if (canWorker) {
      const worker = new Worker(new URL('./image-worker.js', import.meta.url), { type: 'module' });
      try {
        output = await new Promise(async (resolve, reject) => {
          const timeout = setTimeout(() => { worker.terminate(); reject(new Error('Fotoğraf işleme zaman aşımına uğradı.')); }, 60_000);
          worker.addEventListener('message', (event) => {
            if (event.data.id !== task.id) return;
            clearTimeout(timeout);
            if (event.data.type === 'failure') reject(new Error(event.data.error));
            else resolve({ blob: new Blob([event.data.buffer], { type: event.data.mime }), mime: event.data.mime, width: event.data.width, height: event.data.height, durationMs: event.data.durationMs, method: 'Web Worker' });
          }, { once: false });
          worker.addEventListener('error', (event) => { clearTimeout(timeout); reject(new Error(event.message || 'İşçi hatası.')); }, { once: true });
          const buffer = await file.arrayBuffer(); worker.postMessage({ type: 'process', id: task.id, name: file.name, buffer, settings }, [buffer]);
        });
      } finally { worker.terminate(); }
    } else output = await processOnMainThread(file, settings);
    if (output.blob.type !== settings.format || output.width > settings.maxWidth || output.height > settings.maxHeight) throw new Error('İşlenen sonuç seçilen ayarlarla uyuşmuyor.');
    peerAnnounce(`İşlendi: ${output.width} × ${output.height} px · ${fmtDuration(output.durationMs)}. Sonuç gönderiliyor…`);
    await peer.sendResult(task.id, { ...output, name: outputName(task.offer.name, output.blob.type) });
    peerAnnounce(`Sonuç karşı cihaza gönderildi (${formatBytes(output.blob.size)}).`);
  } catch (error) {
    peerAnnounce(`İş başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    try { peer?.sendControl({ type: 'job-error', id: task.id, error: error instanceof Error ? error.message : 'İşleme başarısız.' }); } catch {}
  }
}
function ensurePeer() {
  peer?.close(false);
  peer = new PeerSession({
    onState: setPeerState,
    onIncomingJob: renderIncomingOffer,
    onIncomingFile: processIncomingPeerFile,
    onProgress: peerAnnounce,
    onFailure: (message) => { peerAnnounce(message); elements.peerState.textContent = message; elements.peerState.classList.add('error'); }
  });
  return peer;
}

// Input handling: every file remains an independent job; invalid files don't stop the rest.
elements.choose.addEventListener('click', () => elements.fileInput.click());
elements.drop.addEventListener('click', (event) => { if (event.target.closest('button')) return; elements.fileInput.click(); });
elements.drop.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); elements.fileInput.click(); } });
elements.fileInput.addEventListener('change', () => addFiles(elements.fileInput.files));
for (const eventName of ['dragenter', 'dragover']) elements.drop.addEventListener(eventName, (event) => { event.preventDefault(); if (!running) elements.drop.classList.add('dragover'); });
for (const eventName of ['dragleave', 'drop']) elements.drop.addEventListener(eventName, (event) => { event.preventDefault(); elements.drop.classList.remove('dragover'); });
elements.drop.addEventListener('drop', (event) => { if (!running) addFiles(event.dataTransfer?.files); });
elements.quality.addEventListener('input', () => { elements.qualityValue.textContent = `${elements.quality.value}%`; });
[elements.format, elements.width, elements.height].forEach((control) => control.addEventListener('change', updateControls));
elements.workerCount.addEventListener('change', updateControls);
elements.process.addEventListener('click', async () => { const row = await runLocal(items.filter((item) => item.valid).map((item) => item.id), Number(elements.workerCount.value)); if (row) { /* benchmark buttons persist independent runs */ } });
elements.cancel.addEventListener('click', () => {
  runId += 1;
  activeWorkers.forEach((entry) => { try { entry.cancel(); entry.worker.terminate(); } catch {} }); activeWorkers = [];
  items.filter((item) => item.status === 'Sırada' || item.status === 'İşleniyor').forEach((item) => { item.status = 'İptal edildi'; item.error = 'Kullanıcı tarafından iptal edildi.'; });
  setProcessingUI(false); renderFiles(); showResults(); updateControls(); announce('İşlem iptal edildi. Tamamlanmış sonuçlar korunuyor.');
});
elements.downloadAll.addEventListener('click', async () => {
  const done = items.filter((item) => item.outputBlob);
  if (!done.length) return;
  try {
    const seen = new Set(); const archive = await buildZip(done.map((item) => ({ name: uniqueArchiveName(item.resultName || outputName(item.file.name, item.outputBlob.type), seen), blob: item.outputBlob })));
    downloadBlob(archive, `ortak-sonuclar-${new Date().toISOString().slice(0, 10)}.zip`); announce(`${done.length} sonuç ZIP dosyası olarak hazırlandı.`);
  } catch (error) { announce(`ZIP oluşturulamadı: ${error.message}`, true); }
});
elements.benchmarkSingle.addEventListener('click', async () => { const ids = items.filter((item) => item.valid).map((item) => item.id); const row = await runLocal(ids, 1, 'Yerel · tek işçi'); if (row) addBenchmark(row); });
elements.benchmarkMulti.addEventListener('click', async () => { const ids = items.filter((item) => item.valid).map((item) => item.id); const row = await runLocal(ids, Number(elements.workerCount.value), 'Yerel · çoklu işçi'); if (row) addBenchmark(row); });
elements.clearBenchmark.addEventListener('click', () => { benchmarkRows = []; elements.benchmarkResults.hidden = true; elements.benchmarkTable.replaceChildren(); });
elements.openPeer.addEventListener('click', () => { elements.peerPanel.hidden = false; elements.peerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }); if (!peer) ensurePeer(); });
elements.closePeer.addEventListener('click', () => { peer?.close(); peer = null; elements.peerPanel.hidden = true; elements.peerControls.hidden = true; elements.peerState.textContent = 'Bağlantı kurulmadı.'; updateControls(); });
elements.createOffer.addEventListener('click', async () => {
  try { const session = ensurePeer(); elements.createOffer.disabled = true; peerAnnounce('ICE adayları toplanıyor…'); const offer = await session.createOffer(); elements.offerOutput.value = offer; /** @type {HTMLButtonElement} */ (document.querySelector('[data-copy="offer-output"]')).disabled = false; peerAnnounce('Davet hazır. Metni ikinci cihaza kopyala.'); }
  catch (error) { peerAnnounce(error.message); setPeerState('failed', error.message); }
  finally { elements.createOffer.disabled = false; }
});
elements.createAnswer.addEventListener('click', async () => {
  try { if (!elements.offerInput.value.trim()) throw new Error('Önce ilk cihazın davet metnini yapıştır.'); const session = ensurePeer(); elements.createAnswer.disabled = true; peerAnnounce('Davet kontrol ediliyor ve yanıt hazırlanıyor…'); const answer = await session.createAnswer(elements.offerInput.value.trim()); elements.answerOutput.value = answer; /** @type {HTMLButtonElement} */ (document.querySelector('[data-copy="answer-output"]')).disabled = false; peerAnnounce('Yanıt hazır. İlk cihaza geri gönder.'); }
  catch (error) { peerAnnounce(error.message); setPeerState('failed', error.message); }
  finally { elements.createAnswer.disabled = false; }
});
elements.connectPeer.addEventListener('click', async () => {
  try { if (!elements.answerInput.value.trim()) throw new Error('Önce ikinci cihazın yanıt metnini yapıştır.'); if (!peer) throw new Error('Önce bu cihazda “Davet oluştur” düğmesine bas.'); elements.connectPeer.disabled = true; await peer.acceptAnswer(elements.answerInput.value.trim()); peerAnnounce('Yanıt alındı, bağlantı kuruluyor…'); }
  catch (error) { peerAnnounce(error.message); setPeerState('failed', error.message); }
  finally { elements.connectPeer.disabled = false; }
});
/** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('[data-copy]')).forEach((button) => button.addEventListener('click', async () => {
  const field = /** @type {HTMLTextAreaElement | null} */ (document.getElementById(button.dataset.copy)); if (!field || !field.value) return;
  try { await navigator.clipboard.writeText(field.value); peerAnnounce('Metin panoya kopyalandı.'); }
  catch { field.focus(); field.select(); peerAnnounce('Otomatik kopyalama kullanılamadı; seçili metni elle kopyala.'); }
}));
elements.sendPeerJob.addEventListener('click', async () => {
  const item = items.find((candidate) => candidate.id === elements.peerFileSelect.value);
  if (!item || !peer?.connected()) { peerAnnounce('Önce geçerli bir fotoğraf seç ve bağlantıyı kur.'); return; }
  let settings; try { settings = settingsFromUI(); } catch (error) { peerAnnounce(error.message); return; }
  elements.sendPeerJob.disabled = true; const started = performance.now();
  try {
    const result = await peer.sendWorkJob(item, settings);
    const bitmap = await createImageBitmap(result.blob);
    try {
      if (result.meta.mime !== settings.format || result.blob.type !== settings.format || bitmap.width !== result.meta.width || bitmap.height !== result.meta.height || bitmap.width > settings.maxWidth || bitmap.height > settings.maxHeight || bitmap.width > MAX_SIDE || bitmap.height > MAX_SIDE || bitmap.width * bitmap.height > MAX_PIXELS) throw new Error('Karşı cihazın sonucu seçilen biçim/boyut ayarlarıyla uyuşmuyor.');
      setItemOutput(item, { blob: result.blob, width: bitmap.width, height: bitmap.height, durationMs: result.meta.durationMs, method: `Eş cihaz (WebRTC) · toplam ${fmtDuration(result.transferMs)}` }, settings, `Eş cihaz (WebRTC) · aktarım ${fmtDuration(result.transferMs)}`);
    } finally { bitmap.close(); }
    const elapsedMs = performance.now() - started;
    addBenchmark({ label: 'Eş cihaz · WebRTC', elapsedMs, success: 1, failed: 0, transferBytes: result.sentBytes + result.receivedBytes, taskCount: 1, at: new Date().toISOString() });
    renderFiles(); showResults(); peerAnnounce(`Başarılı: ${formatBytes(item.file.size)} gönderildi, ${formatBytes(result.blob.size)} sonuç alındı. Uçtan uca ${fmtDuration(elapsedMs)}.`);
  } catch (error) { peerAnnounce(`Dağıtık iş başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}. Yerel işleme “Fotoğrafları işle” düğmesiyle devam edebilirsin.`); }
  finally { updateControls(); updatePeerFileSelect(); }
});

// Make a disconnected state obvious if the user reloads while the peer panel is open.
window.addEventListener('beforeunload', () => { peer?.close(false); activeWorkers.forEach((entry) => entry.worker.terminate()); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  navigator.serviceWorker.register('./service-worker.js').then(() => { swRegistered = true; }).catch(() => { swRegistered = false; });
}
renderFiles(); renderResults(); updateControls();
