import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { RELIC_LINES } from "../src/lib/relics/lines.ts";

const ROOT = new URL("../public/icons/relics/", import.meta.url);

function namesFor(lineId: string, base: string, final: string): string[] {
  const bare = base.replace(/^The /, "");
  if (lineId === "zodiac") {
    const braves = final.replace(/ Zeta$/, "");
    return [base, `${base} Zenith`, `${base} Atma`, `${base} Animus`, `${base} Novus`, `${base} Nexus`, braves, final];
  }
  if (lineId === "anima") {
    return [
      `Animated ${bare}`,
      `Awoken ${bare}`,
      `Anima ${bare}`,
      `Hyperconductive ${bare}`,
      `Reconditioned ${bare}`,
      `Sharpened ${bare}`,
      `Complete ${bare}`,
      final,
    ];
  }
  if (lineId === "eureka") {
    return [`${bare} Anemos`, `${bare} Elemental`, `${bare} Pyros`, `${bare} Eureka`, final];
  }
  if (lineId === "manderville") {
    return [base, base.replace("Manderville", "Amazing Manderville"), base.replace("Manderville", "Majestic Manderville"), final];
  }
  if (lineId === "phantom") {
    return ["Penumbrae", "Umbrae", "Obscurum", "Eclipticum", "Occultum"].map((step) =>
      step === "Occultum" ? final : base.replace("Penumbrae", step),
    );
  }
  return [];
}

async function iconPath(name: string): Promise<string | null> {
  const url = `https://v2.xivapi.com/api/search?sheets=Item&query=${encodeURIComponent(`Name="${name}"`)}&fields=Name,Icon`;
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "Reliquary/1.0" } });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: Array<{ fields?: { Name?: string; Icon?: { path_hr1?: string; path?: string } } }> };
  const row = json.results?.find((item) => item.fields?.Name === name);
  return row?.fields?.Icon?.path_hr1 || row?.fields?.Icon?.path || null;
}

async function saveIcon(asset: string, dest: string): Promise<boolean> {
  const url = `https://v2.xivapi.com/api/asset?path=${encodeURIComponent(asset)}&format=png`;
  const res = await fetch(url, { headers: { Accept: "image/png", "User-Agent": "Reliquary/1.0" } });
  if (!res.ok) return false;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length < 200 || bytes[0] !== 0x89) return false;
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, bytes);
  return true;
}

const jobs: Array<{ line: string; job: string; names: string[] }> = [];
for (const line of RELIC_LINES) {
  for (const [job, names] of Object.entries(line.weaponNames)) {
    if (!names) continue;
    const list = namesFor(line.id, names.base, names.final);
    if (list.length === line.stages.length) jobs.push({ line: line.id, job, names: list });
  }
}

let found = 0;
let missed = 0;
const queue = jobs.flatMap((row) => row.names.map((name, stage) => ({ ...row, name, stage })));

async function worker() {
  for (;;) {
    const next = queue.shift();
    if (!next) return;
    const asset = await iconPath(next.name);
    const dest = new URL(`${next.line}/${next.job}/${next.stage}.png`, ROOT);
    if (asset && (await saveIcon(asset, dest.pathname))) found += 1;
    else {
      missed += 1;
      console.log("miss", next.line, next.job, next.stage, next.name);
    }
  }
}

await Promise.all(Array.from({ length: 4 }, () => worker()));
console.log({ found, missed, queued: found + missed });
