import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const nodeBin = dirname(process.execPath);
const candidates = [
  resolve(root, 'node_modules/typescript/bin/tsc'),
  resolve(nodeBin, '../lib/node_modules/typescript/bin/tsc')
].filter(existsSync);

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) {
    console.error(`TypeScript denetimi başlatılamadı: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (candidates.length) {
  const tsc = candidates[0];
  run(process.execPath, [tsc, '-p', 'tsconfig.json']);
  run(process.execPath, [tsc, '-p', 'tsconfig.worker.json']);
} else {
  // Fallback for clean machines: this downloads the pinned dev-only compiler from npm.
  run('npx', ['--yes', '--package', 'typescript@5.8.3', 'tsc', '-p', 'tsconfig.json']);
  run('npx', ['--yes', '--package', 'typescript@5.8.3', 'tsc', '-p', 'tsconfig.worker.json']);
}
console.log('Tür denetimi başarılı.');
