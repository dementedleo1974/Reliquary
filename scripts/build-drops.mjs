/**
 * Builds public/drops.json from Garland Tools instance loot and gathering nodes.
 * Coordinates are the in-game x/y used on the map.
 */
const UA = "ReliquaryDrops/1.0";
const DIFFS = [
  [/\s*\(ultimate\)$/i, "Ultimate"],
  [/\s*\(savage\)$/i, "Savage"],
  [/\s*\(extreme\)$/i, "Extreme"],
  [/\s*\(hard\)$/i, "Hard"],
  [/\s+unreal$/i, "Unreal"],
];
const NODE_KIND = {
  0: "Mining",
  1: "Quarrying",
  2: "Logging",
  3: "Harvesting",
};

function norm(name) {
  return name
    .toLowerCase()
    .replace(/['’:.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitDiff(name) {
  let base = name.replace(/^the minstrel's ballad:\s*/i, "").trim();
  let diff = /^the minstrel's ballad:/i.test(name) ? "Extreme" : "Normal";
  for (const [re, label] of DIFFS) {
    if (re.test(base)) {
      diff = label;
      base = base.replace(re, "").trim();
      break;
    }
  }
  return { base, diff, g: norm(base) };
}

async function getJson(url) {
  let last = "fail";
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (error) {
      last = error instanceof Error ? error.message : "fail";
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error(last);
}

async function pool(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, run));
  return out;
}

function namesFrom(partials) {
  const names = new Map();
  for (const part of partials ?? []) {
    if (part?.type === "item" && part.obj?.n) names.set(String(part.id), part.obj.n);
  }
  return names;
}

function itemNames(ids, lookup) {
  const seen = new Set();
  const out = [];
  for (const id of ids ?? []) {
    const name = lookup.get(String(id));
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length >= 48) break;
  }
  return out;
}

function coord(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0.5 || n > 50) return null;
  return Math.round(n * 10) / 10;
}

const core = await getJson("https://www.garlandtools.org/db/doc/core/en/3/data.json");
const locations = core.locationIndex ?? {};
const index = await getJson("https://www.garlandtools.org/db/doc/browse/en/2/instance.json");
const instances = index.browse ?? [];
console.log("instances", instances.length);

const duties = [];
let failed = 0;
await pool(instances, 8, async (row) => {
  try {
    const doc = await getJson(`https://www.garlandtools.org/db/doc/instance/en/2/${row.i}.json`);
    const inst = doc.instance;
    if (!inst?.name) return;
    const lookup = namesFrom(doc.partials);
    const { diff, g } = splitDiff(inst.name);
    const used = new Set();
    const coffers = [];
    for (const coffer of inst.coffers ?? []) {
      const items = itemNames(coffer.items, lookup);
      for (const item of items) used.add(item);
      if (items.length === 0) continue;
      const spot = { items };
      const x = coord(coffer.coords?.[0]);
      const y = coord(coffer.coords?.[1]);
      if (x != null && y != null) {
        spot.x = x;
        spot.y = y;
      }
      coffers.push(spot);
    }
    const fights = [];
    for (const fight of inst.fights ?? []) {
      const items = itemNames(fight.coffer?.items, lookup);
      for (const item of items) used.add(item);
      if (items.length === 0) continue;
      fights.push({ t: fight.type === "Boss" ? "Boss" : "Mid boss", items });
    }
    const extra = itemNames(inst.rewards, lookup).filter((name) => !used.has(name)).slice(0, 24);
    if (coffers.length === 0 && fights.length === 0 && extra.length === 0) return;
    duties.push({
      n: inst.name,
      d: diff,
      g,
      lv: inst.min_lvl || 0,
      sy: inst.max_lvl || 0,
      coffers,
      fights,
      extra,
    });
  } catch {
    failed += 1;
  }
});
console.log("duties", duties.length, "failed", failed);

const nodeIndex = await getJson("https://www.garlandtools.org/db/doc/browse/en/2/node.json");
const nodes = [];
let nodeFail = 0;
await pool(nodeIndex.browse ?? [], 8, async (row) => {
  try {
    const doc = await getJson(`https://www.garlandtools.org/db/doc/node/en/2/${row.i}.json`);
    const node = doc.node;
    const zone = locations[String(node?.zoneid)]?.name;
    if (!node?.name || !zone) return;
    const lookup = namesFrom(doc.partials);
    const items = itemNames((node.items ?? []).map((item) => item.id), lookup);
    const x = coord(node.coords?.[0]);
    const y = coord(node.coords?.[1]);
    if (items.length === 0 || x == null || y == null) return;
    nodes.push({
      z: zone,
      n: node.name,
      k: NODE_KIND[node.type] ?? "Gathering",
      lv: node.lvl || 0,
      x,
      y,
      items,
    });
  } catch {
    nodeFail += 1;
  }
});
console.log("nodes", nodes.length, "failed", nodeFail);

duties.sort((a, b) => a.g.localeCompare(b.g) || a.lv - b.lv || a.n.localeCompare(b.n));
nodes.sort((a, b) => a.z.localeCompare(b.z) || a.n.localeCompare(b.n));
const fs = await import("node:fs");
fs.writeFileSync("public/drops.json", JSON.stringify({ duties, nodes }));
console.log("bytes", fs.statSync("public/drops.json").size);
