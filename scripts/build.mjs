import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const hasTypeScript = spawnSync('tsc', ['--version'], { cwd: root, stdio: 'ignore' }).status === 0;
if (hasTypeScript) {
  const appCheck = spawnSync('tsc', ['-p', 'tsconfig.json'], { cwd: root, stdio: 'inherit' });
  const workerCheck = spawnSync('tsc', ['-p', 'tsconfig.worker.json'], { cwd: root, stdio: 'inherit' });
  if (appCheck.status !== 0 || workerCheck.status !== 0) {
    console.error('Tür denetimi başarısız. Derleme durduruldu.');
    process.exit(1);
  }
} else {
  console.log('Global TypeScript bulunamadı; isteğe bağlı tür denetimi atlandı. Uygulama çalışma zamanı bağımlılığı içermez.');
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(resolve(root, 'public'), dist, { recursive: true });
console.log('Üretim çıktısı hazır: dist/ (çalışma zamanı bağımlılığı veya paketleme sunucusu gerekmiyor)');
