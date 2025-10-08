import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { csvParse } from 'd3-dsv';
import Flatbush from 'flatbush';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const SERVICES_CSV = path.join(publicDir, 'acecqa_processed_data.csv');
const OUT_BIN = path.join(publicDir, 'services.index.bin');
const OUT_META = path.join(publicDir, 'services.index.meta.json');

function toNumber(value) {
  if (value == null) return null;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : null;
}

async function main() {
  console.log('[build-index] Reading CSV:', SERVICES_CSV);
  const csvText = fs.readFileSync(SERVICES_CSV, 'utf8');
  const services = csvParse(csvText);
  console.log(`[build-index] Loaded ${services.length} services`);

  const index = new Flatbush(services.length);
  let added = 0;
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    const lat = toNumber(s.latitude);
    const lng = toNumber(s.longitude);
    if (lat == null || lng == null) continue;
    index.add(lng, lat, lng, lat);
    added++;
  }
  index.finish();
  console.log(`[build-index] Finished index. Added ${added} points`);

  // Resolve the internal ArrayBuffer for Flatbush (robust across versions)
  const pickArrayBuffer = (idx) => {
    if (idx?.data?.buffer instanceof ArrayBuffer) return idx.data.buffer;
    if (idx?.data instanceof ArrayBuffer) return idx.data;
    if (idx?.arrayBuffer instanceof ArrayBuffer) return idx.arrayBuffer;
    // Fallback: scan for a TypedArray
    let best = null;
    for (const key of Object.keys(idx)) {
      const val = idx[key];
      if (val && val.buffer instanceof ArrayBuffer && typeof val.byteLength === 'number') {
        if (!best || val.byteLength > best.byteLength) best = val;
      }
    }
    return best ? best.buffer : null;
  };

  const arrayBuffer = pickArrayBuffer(index);
  if (!arrayBuffer) {
    console.error('[build-index] Could not locate Flatbush internal ArrayBuffer. Keys:', Object.keys(index));
    throw new Error('Flatbush ArrayBuffer not found');
  }

  // Write binary
  fs.writeFileSync(OUT_BIN, Buffer.from(new Uint8Array(arrayBuffer)));
  // Write metadata (keep count to reconstruct)
  fs.writeFileSync(OUT_META, JSON.stringify({ count: services.length }, null, 2));
  console.log(`[build-index] Wrote index to ${OUT_BIN} and meta to ${OUT_META}`);
}

main().catch((e) => {
  console.error('[build-index] Failed:', e);
  process.exit(1);
});


