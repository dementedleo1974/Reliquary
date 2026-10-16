/** Adds job and Grand Company hunting-log mobs to public/atlas.json. */
import fs from "node:fs";

const API = "https://v2.xivapi.com/api/sheet/MonsterNote";
const GC_NEED = {
  Maelstrom: { 1: "Storm Sergeant Third Class", 2: "Second Storm Lieutenant" },
  "Twin Adder": { 1: "Serpent Sergeant Third Class", 2: "Second Serpent Lieutenant" },
  "Order of the Twin Adder": { 1: "Serpent Sergeant Third Class", 2: "Second Serpent Lieutenant" },
  "Immortal Flames": { 1: "Flame Sergeant Third Class", 2: "Second Flame Lieutenant" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  const res = await fetch(url, { headers: { "User-Agent": "ReliquaryAtlas/1.0", Accept: "application/json" } });
  if ((res.status === 429 || res.status === 503 || res.status === 502) && attempt < 6) {
    await sleep(400 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${String(url).slice(0, 160)}`);
  return res.json();
}

function titleMob(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/ ([a-z])/g, (_, c) => ` ${c.toUpperCase()}`);
}

const hunts = [];
const seen = new Set();
let after = "";
let pages = 0;

for (;;) {
  const url = new URL(API);
  url.searchParams.set("limit", "80");
  url.searchParams.set("language", "en");
  url.searchParams.set(
    "fields",
    "Name,Count,MonsterNoteTarget[].BNpcName.Singular,MonsterNoteTarget[].PlaceNameZone[].Name,MonsterNoteTarget[].PlaceNameLocation[].Name",
  );
  if (after) url.searchParams.set("after", after);
  const json = await getJson(url);
  const rows = json.rows ?? [];
  if (!rows.length) break;
  for (const row of rows) {
    const name = String(row.fields?.Name ?? "").trim();
    const match = name.match(/^(.+?) (\d+)$/);
    if (!match) continue;
    const who = match[1];
    const entry = Number(match[2]);
    const rank = Math.ceil(entry / 10);
    const kind = GC_NEED[who] ? "gc" : "job";
    const need = GC_NEED[who]?.[rank] ?? "";
    const counts = row.fields.Count ?? [];
    const targets = row.fields.MonsterNoteTarget ?? [];
    targets.forEach((target, index) => {
      const count = Number(counts[index] ?? 0);
      const mob = titleMob(target?.fields?.BNpcName?.fields?.Singular);
      if (!count || !mob) return;
      const zones = target.fields.PlaceNameZone ?? [];
      const areas = target.fields.PlaceNameLocation ?? [];
      const spots = Math.max(zones.length, 1);
      for (let i = 0; i < spots; i++) {
        const zone = zones[i]?.fields?.Name?.trim();
        if (!zone) continue;
        const area = areas[i]?.fields?.Name?.trim() || zone;
        const key = `${zone}|${area}|${mob}|${who}|${entry}`;
        if (seen.has(key)) continue;
        seen.add(key);
        hunts.push({ zone, area, mob, count, kind, who, rank, entry, need });
      }
    });
  }
  const last = rows[rows.length - 1];
  const next = String(last.row_id);
  pages += 1;
  if (pages % 5 === 0) console.log(`  page ${pages} @ ${next} hunts ${hunts.length}`);
  if (next === after || rows.length < 80 || pages > 40) break;
  after = next;
}

const atlas = JSON.parse(fs.readFileSync("public/atlas.json", "utf8"));
atlas.hunts = hunts;
fs.writeFileSync("public/atlas.json", JSON.stringify(atlas));
fs.writeFileSync("public/atlas-places.json", JSON.stringify({ patch: atlas.patch, places: atlas.places }));
fs.writeFileSync(
  "public/atlas-detail.json",
  JSON.stringify({ vendors: atlas.vendors, hunts: atlas.hunts ?? [] }),
);
const who = {};
for (const hunt of hunts) who[hunt.who] = (who[hunt.who] ?? 0) + 1;
console.log(JSON.stringify({ hunts: hunts.length, who, bytes: fs.statSync("public/atlas.json").size }));
const { spawnSync } = await import("node:child_process");
spawnSync(process.execPath, ["scripts/compress-json.mjs", "public/atlas.json", "public/atlas-places.json", "public/atlas-detail.json"], { stdio: "inherit" });
