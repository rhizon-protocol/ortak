import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
const publicRoot = resolve(fileURLToPath(new URL('../public/', import.meta.url)));
let servingRoot = root;
try { await stat(root); } catch { servingRoot = publicRoot; }
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};
const server = createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    const path = requestPath === '/' ? '/index.html' : requestPath;
    const filePath = normalize(join(servingRoot, path));
    if (filePath !== servingRoot && !filePath.startsWith(servingRoot + sep)) { res.writeHead(403).end('Forbidden'); return; }
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime[extname(filePath)] ?? 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Dosya bulunamadı. Önce npm run build komutunu çalıştırın.');
  }
});
const port = Number(process.env.PORT ?? 4173);
server.listen(port, '0.0.0.0', () => console.log(`Ortak hazır: http://localhost:${port} (${servingRoot})`));
