import { readFileSync, writeFileSync } from "node:fs";
import { brotliCompressSync, constants, deflateRawSync } from "node:zlib";

/** Lossless copies. Brotli quality 11 is the smallest. Deflate level 9 is the fallback every browser can open. */
const files = process.argv.slice(2);
if (files.length === 0) {
  files.push(
    "public/atlas.json",
    "public/atlas-places.json",
    "public/atlas-detail.json",
    "public/drops.json",
    "public/strategies.json",
  );
}

for (const file of files) {
  const raw = readFileSync(file);
  const brotli = brotliCompressSync(raw, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });
  const deflate = deflateRawSync(raw, { level: 9 });
  writeFileSync(`${file}.br`, brotli);
  writeFileSync(`${file}.deflate`, deflate);
  console.log(`${file} ${raw.length} -> brotli ${brotli.length}, deflate ${deflate.length}`);
}
