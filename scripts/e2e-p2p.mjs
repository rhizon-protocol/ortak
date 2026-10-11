/* Optional local integration test. Needs Chromium and a running `npm run serve`. */
import assert from 'node:assert/strict';

const timeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CDPPage {
  constructor(port, target) {
    this.port = port; this.target = target; this.id = 0; this.pending = new Map(); this.events = [];
    this.ws = new WebSocket(target.webSocketDebuggerUrl);
    this.ready = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`CDP ${port} bağlantı zaman aşımı`)), 5000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error(`CDP ${port} websocket açılamadı`)); }, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.id && this.pending.has(message.id)) {
        const handler = this.pending.get(message.id); this.pending.delete(message.id);
        message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') {
        this.events.push({ type: 'exception', text: message.params.exceptionDetails?.text || 'uncaught exception' });
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        this.events.push({ type: 'console', text: message.params.entry.text });
      }
    });
  }
  async send(method, params = {}) {
    await this.ready;
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); } }, 15000);
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'browser evaluation failed');
    return result.result?.value;
  }
  async waitFor(expression, description, ms = 30000) {
    const until = Date.now() + ms;
    while (Date.now() < until) {
      const value = await this.evaluate(expression);
      if (value) return value;
      await timeout(150);
    }
    throw new Error(`Zaman aşımı: ${description}`);
  }
  close() { try { this.ws.close(); } catch {} }
}

async function connectPage(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`Chromium debugging port ${port} yanıt vermedi`);
  const targets = await response.json();
  const target = targets.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  if (!target) throw new Error(`Chromium ${port} sayfa hedefi bulunamadı`);
  const page = new CDPPage(port, target);
  await page.send('Runtime.enable'); await page.send('Page.enable'); await page.send('Log.enable');
  await page.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
  await page.waitFor("document.readyState === 'complete' && !!document.querySelector('#process-button')", 'uygulamanın yüklenmesi', 20000);
  return page;
}

async function addSyntheticImages(page) {
  return page.evaluate(`(async () => {
    const files = [];
    const specs = [
      { name: 'deneme-bahar.jpg', type: 'image/jpeg', w: 360, h: 240, c: '#d8e9bd' },
      { name: 'deneme-kare.png', type: 'image/png', w: 120, h: 80, c: '#f5d9a9' },
      { name: 'deneme-mavi.webp', type: 'image/webp', w: 220, h: 150, c: '#c7ddeb' },
      { name: 'bozuk-dosya.png', type: 'image/png', bad: true }
    ];
    for (const spec of specs) {
      if (spec.bad) { files.push(new File(['not an image'], spec.name, { type: spec.type })); continue; }
      const canvas = document.createElement('canvas'); canvas.width = spec.w; canvas.height = spec.h;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = spec.c; ctx.fillRect(0, 0, spec.w, spec.h);
      ctx.fillStyle = '#344b39'; ctx.fillRect(10, 10, Math.max(20, spec.w / 3), Math.max(10, spec.h / 4));
      const blob = await new Promise(resolve => canvas.toBlob(resolve, spec.type, .94));
      files.push(new File([blob], spec.name, { type: spec.type }));
    }
    const transfer = new DataTransfer(); files.forEach(file => transfer.items.add(file));
    const input = document.querySelector('#file-input'); input.files = transfer.files; input.dispatchEvent(new Event('change', { bubbles: true }));
    return files.map(file => ({ name: file.name, size: file.size, type: file.type }));
  })()`);
}

const report = { browser: 'Chromium headless', local: null, peer: null, errors: [] };
let a; let b;
try {
  a = await connectPage(9222); b = await connectPage(9223);
  const added = await addSyntheticImages(a);
  assert.equal(added.length, 4, 'four synthetic images should be queued');
  await a.evaluate("document.querySelector('#process-button').click()");
  const localResult = await a.waitFor("(() => { const rows=[...document.querySelectorAll('#result-list .result-item')]; return rows.length === 4 && rows.filter(r=>r.querySelector('.result-metrics')).length === 3 && rows.some(r=>r.innerText.includes('bozuk-dosya.png') && r.innerText.includes('Başarısız')); })()", '3 başarılı görsel ve 1 bozuk dosya sonucunun oluşması', 30000);
  report.local = await a.evaluate(`(() => ({status:document.querySelector('#operation-status').innerText, rows:[...document.querySelectorAll('#result-list .result-item')].map(r=>r.innerText.replace(/\\s+/g,' ').trim()), stats:document.querySelector('#summary-stats').innerText.replace(/\\s+/g,' ').trim(), workerMethods:[...document.querySelectorAll('.result-metrics')].map(r=>r.innerText)}))()`);

  await a.evaluate("document.querySelector('#open-peer').click()"); await b.evaluate("document.querySelector('#open-peer').click()");
  await a.evaluate("document.querySelector('#create-offer').click()");
  const offer = await a.waitFor("document.querySelector('#offer-output').value.length > 20 && !document.querySelector('#create-offer').disabled ? document.querySelector('#offer-output').value : null", 'WebRTC offer', 25000);
  await b.evaluate(`(() => { const field=document.querySelector('#offer-input'); field.value=${JSON.stringify(offer)}; field.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#create-answer').click(); })()`);
  const answer = await b.waitFor("document.querySelector('#answer-output').value.length > 20 && !document.querySelector('#create-answer').disabled ? document.querySelector('#answer-output').value : null", 'WebRTC answer', 25000);
  await a.evaluate(`(() => { const field=document.querySelector('#answer-input'); field.value=${JSON.stringify(answer)}; field.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#connect-peer').click(); })()`);
  await Promise.all([
    a.waitFor("document.querySelector('#peer-state').classList.contains('connected')", 'ilk oturum WebRTC bağlantısı', 20000),
    b.waitFor("document.querySelector('#peer-state').classList.contains('connected')", 'ikinci oturum WebRTC bağlantısı', 20000)
  ]);
  await a.evaluate("document.querySelector('#peer-file-select').value=[...document.querySelector('#peer-file-select').options].find(o=>o.textContent.includes('deneme-bahar.jpg')).value; document.querySelector('#peer-file-select').dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('#send-peer-job').click()");
  await b.waitFor("!document.querySelector('#incoming-job').hidden && document.querySelector('#incoming-job').innerText.includes('deneme-bahar.jpg')", 'alıcıda açık onay istemi', 15000);
  const beforeConsent = await b.evaluate("({visible:!document.querySelector('#incoming-job').hidden, buttons:[...document.querySelectorAll('#incoming-job button')].map(b=>b.innerText), status:document.querySelector('#peer-progress').innerText})");
  await b.evaluate("[...document.querySelectorAll('#incoming-job button')].find(button=>button.innerText.includes('Kabul')).click()");
  await a.waitFor("[...document.querySelectorAll('#result-list .result-metrics')].some(r=>r.innerText.includes('Eş cihaz (WebRTC)')) && document.querySelector('#peer-progress').innerText.includes('Başarılı')", 'sonucun ilk cihaza geri dönmesi', 45000);
  report.peer = {
    beforeConsent,
    sender: await a.evaluate("({state:document.querySelector('#peer-state').innerText,progress:document.querySelector('#peer-progress').innerText,benchmark:document.querySelector('#benchmark-table').innerText.replace(/\\s+/g,' ').trim(),results:[...document.querySelectorAll('#result-list .result-item')].map(r=>r.innerText.replace(/\\s+/g,' ').trim())})"),
    receiver: await b.evaluate("({state:document.querySelector('#peer-state').innerText,progress:document.querySelector('#peer-progress').innerText})")
  };
  report.errors = [...a.events.map(e=>({page:'A',...e})), ...b.events.map(e=>({page:'B',...e}))];
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 2;
} catch (error) {
  report.failure = error instanceof Error ? error.stack : String(error);
  report.errors = [...(a?.events ?? []).map(e=>({page:'A',...e})), ...(b?.events ?? []).map(e=>({page:'B',...e}))];
  console.error(JSON.stringify(report, null, 2)); process.exitCode = 1;
} finally { a?.close(); b?.close(); }
