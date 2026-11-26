import { mkdir, cp, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (path.basename(dist) !== 'dist' || !dist.startsWith(root + path.sep)) throw new Error('Build output must stay inside the project.');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'gallery.html', 'src', 'public']) {
  await cp(path.join(root, name), path.join(dist, name), { recursive: true, filter: (source) => !source.split(path.sep).includes('raw') });
}
await writeFile(path.join(dist, '.nojekyll'), '');
console.log('Built dist/ — static HTML, JavaScript, CSS and local scene images.');
