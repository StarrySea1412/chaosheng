import { readdir, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let checks = 0;
for (const folder of ['src', 'scripts']) {
  for (const name of await readdir(path.join(root, folder))) {
    if (!/\.(m?js)$/.test(name)) continue;
    const result = spawnSync(process.execPath, ['--check', path.join(root, folder, name)], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error(`${folder}/${name}: ${result.stderr}`);
    checks += 1;
  }
}
await stat(path.join(root, 'public', 'favicon.svg'));
await import('./check-assets.mjs');
console.log(`Passed ${checks + 1} source checks.`);
