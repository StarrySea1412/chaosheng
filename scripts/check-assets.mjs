import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORLD } from '../src/world.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'docs/asset-manifest.json'), 'utf8'));
const sceneIds = WORLD.scenes.map((scene) => scene.id);
assert.equal(manifest.version, 1, 'Unsupported asset manifest version');
assert.ok(manifest.generatedUsing && manifest.attribution && manifest.sourceReference, 'Asset collection needs documented provenance');
assert.deepEqual(manifest.assets.map((asset) => asset.id).sort(), [...sceneIds].sort(), 'Each location needs one documented image');

function webpDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF', 'Not a RIFF image');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP', 'Not a WebP image');
  assert.equal(buffer.readUInt32LE(4) + 8, buffer.length, 'Truncated WebP file');
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const chunk = buffer.toString('ascii', offset, offset + 4);
    const length = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    assert.ok(data + length <= buffer.length, 'Truncated WebP chunk');
    if (chunk === 'VP8X' && length >= 10) {
      return { width: buffer.readUIntLE(data + 4, 3) + 1, height: buffer.readUIntLE(data + 7, 3) + 1 };
    }
    if (chunk === 'VP8 ' && length >= 10) {
      assert.equal(buffer.toString('hex', data + 3, data + 6), '9d012a');
      return { width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff };
    }
    if (chunk === 'VP8L' && length >= 5) {
      assert.equal(buffer[data], 0x2f);
      const packed = buffer.readUInt32LE(data + 1);
      return { width: (packed & 0x3fff) + 1, height: ((packed >>> 14) & 0x3fff) + 1 };
    }
    offset = data + length + (length % 2);
  }
  throw new Error('WebP dimensions were not found');
}

let totalBytes = 0;
for (const asset of manifest.assets) {
  assert.equal(asset.status, 'ready', `${asset.id} has not finished generation`);
  assert.equal(asset.path, `public/scenes/${asset.id}.webp`, 'Asset paths must stay inside public/scenes');
  assert.equal(asset.license, 'CC-BY-4.0');
  assert.ok(asset.model && asset.prompt && asset.generatedAt && asset.taskId, 'Missing generation provenance');
  const buffer = await readFile(path.join(root, asset.path));
  assert.equal(createHash('sha256').update(buffer).digest('hex'), asset.sha256, `${asset.id} hash differs from manifest`);
  assert.equal(buffer.length, asset.bytes, `${asset.id} size differs from manifest`);
  const dimensions = webpDimensions(buffer);
  assert.deepEqual(dimensions, { width: asset.width, height: asset.height }, `${asset.id} dimensions differ from manifest`);
  assert.ok(dimensions.width >= 1200 && dimensions.height >= 760, `${asset.id} is too small for the scene panel`);
  assert.ok(buffer.length < 1_200_000, `${asset.id} needs compression`);
  totalBytes += buffer.length;
}
console.log(`Verified ${manifest.assets.length} scene images, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB, with matching provenance and SHA-256.`);
