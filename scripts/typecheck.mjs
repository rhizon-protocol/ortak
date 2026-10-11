import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const nodeBin = dirname(process.execPath);
const candidates = [
  resolve(root, 'node_modules/typescript/bin/tsc'),
  // Common global-install locations on Windows and Unix-like systems.
  resolve(nodeBin, 'node_modules/typescript/bin/tsc'),
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
  // `spawnSync('npx', ...)` cannot reliably launch npx.cmd on Windows.
  // npm sets npm_execpath while running package scripts; invoking its JS CLI
  // through Node works consistently on Windows, macOS, and Linux.
  const npmCli = process.env.npm_execpath;
  if (npmCli && existsSync(npmCli)) {
    run(process.execPath, [npmCli, 'exec', '--yes', '--package', 'typescript@5.8.3', '--', 'tsc', '-p', 'tsconfig.json']);
    run(process.execPath, [npmCli, 'exec', '--yes', '--package', 'typescript@5.8.3', '--', 'tsc', '-p', 'tsconfig.worker.json']);
  } else {
    const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const result = spawnSync(npx, ['--yes', '--package', 'typescript@5.8.3', 'tsc', '-p', 'tsconfig.json'], {
      cwd: root, stdio: 'inherit', shell: process.platform === 'win32'
    });
    if (result.error) {
      console.error(`TypeScript bulunamadı ve npm üzerinden başlatılamadı: ${result.error.message}`);
      process.exit(1);
    }
    if (result.status !== 0) process.exit(result.status ?? 1);
    const worker = spawnSync(npx, ['--yes', '--package', 'typescript@5.8.3', 'tsc', '-p', 'tsconfig.worker.json'], {
      cwd: root, stdio: 'inherit', shell: process.platform === 'win32'
    });
    if (worker.error) {
      console.error(`Worker tür denetimi başlatılamadı: ${worker.error.message}`);
      process.exit(1);
    }
    if (worker.status !== 0) process.exit(worker.status ?? 1);
  }
}
console.log('Tür denetimi başarılı.');
