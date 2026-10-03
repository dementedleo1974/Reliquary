/**
 * Builds public/atlas.json from the current XIVAPI game sheets.
 * Maps, duties, and vendor inventories. Safe to re-run.
 */
const API = "https://v2.xivapi.com/api/sheet";
const SHOPS = new Set(["GilShop", "SpecialShop", "GCShop", "InclusionShop", "FccShop"]);
const SHOP_LABEL = {
  GilShop: "Gil",
  SpecialShop: "Special",
  GCShop: "Grand Company",
  InclusionShop: "Allied",
  FccShop: "Field",
};
const DUTY_KIND = {
  Dungeons: "dungeon",
  "Guildhests": "dungeon",
  Trials: "trial",
  Raids: "raid",
  "Alliance Raids": "raid",
  "Ultimate Raids": "raid",
  "Savage Raids": "raid",
  "Variant Dungeons": "dungeon",
  "Criterion Dungeons": "dungeon",
  "Deep Dungeons": "dungeon",
  "V&C Dungeon Finder": "dungeon",
};
const USE_KIND = { 0: "city", 1: "zone", 2: "city" };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 0) {
  const res = await fetch(url, { headers: { "User-Agent": "ReliquaryAtlas/1.0", Accept: "application/json" } });
  if ((res.status === 429 || res.status === 503 || res.status === 502) && attempt < 6) {
    await sleep(400 * (attempt + 1));
    return getJson(url, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${String(url).slice(0, 160)} ${text.slice(0, 180)}`);
  }
  return res.json();
}

async function eachPage(sheet, fields, onRow, limit = 500) {
  let after = "";
  let pages = 0;
  const seen = new Set();
  for (;;) {
    const url = new URL(`${API}/${sheet}`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("language", "en");
    url.searchParams.set("fields", fields);
    if (after) url.searchParams.set("after", after);
    const json = await getJson(url);
    const rows = json.rows ?? [];
    if (!rows.length) break;
    for (const row of rows) onRow(row);
    const last = rows[rows.length - 1];
    const next = last.subrow_id == null ? String(last.row_id) : `${last.row_id}:${last.subrow_id}`;
    pages += 1;
    if (pages % 10 === 0) console.log(`  ${sheet} page ${pages} @ ${next}`);
    if (seen.has(next) || rows.length < limit) break;
    seen.add(next);
    after = next;
    if (pages > 900) throw new Error(`too many pages for ${sheet}`);
  }
  console.log(`  ${sheet} done, ${pages} pages`);
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function linkName(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(linkName).find(Boolean) ?? "";
  if (typeof node.Name === "string" && node.Name) return node.Name;
  if (node.fields) return linkName(node.fields);
  return "";
}

function namesOf(node) {
  if (!node) return [];
  if (typeof node === "string") return node ? [node] : [];
  if (Array.isArray(node)) return node.flatMap(namesOf);
  if (typeof node.Name === "string" && node.Name) return [node.Name];
  if (node.fields) return namesOf(node.fields);
  return [];
}

function toPin(world, offset, sizeFactor) {
  const size = sizeFactor || 100;
  const pixel = ((world + offset) / 100) * size + 1024;
  const game = Math.floor((pixel / size) * 2 * 10 + 10) / 10;
  const pct = (pixel / 2048) * 100;
  return { game, pct };
}

const places = [];
const dutyTerritories = new Set();

console.log("territories");
const territories = [];
await eachPage(
  "TerritoryType",
  "PlaceName.Name,PlaceNameRegion.Name,Map.Id,Map.SizeFactor,Map.OffsetX,Map.OffsetY,TerritoryIntendedUse@as(raw)",
  (row) => {
    const f = row.fields;
    const name = f.PlaceName?.fields?.Name?.trim() ?? "";
    const map = f.Map?.fields?.Id ?? "";
    if (!name || !map || map.startsWith("default/")) return;
    territories.push({
      id: row.row_id,
      name,
      region: f.PlaceNameRegion?.fields?.Name?.trim() || "Eorzea",
      map,
      size: num(f.Map?.fields?.SizeFactor) || 100,
      ox: num(f.Map?.fields?.OffsetX),
      oy: num(f.Map?.fields?.OffsetY),
      use: num(f["TerritoryIntendedUse@as(raw)"]),
    });
  },
);

console.log("duties");
await eachPage(
  "ContentFinderCondition",
  "Name,ClassJobLevelRequired,ClassJobLevelSync,ItemLevelRequired,ContentType.Name,ContentMemberType.Name,TerritoryType,TerritoryType.PlaceNameRegion.Name,TerritoryType.Map.Id,TerritoryType.Map.SizeFactor,TerritoryType.Map.OffsetX,TerritoryType.Map.OffsetY",
  (row) => {
    const f = row.fields;
    const name = (f.Name ?? "").trim();
    const map = f.TerritoryType?.fields?.Map?.fields?.Id ?? "";
    const typeName = f.ContentType?.fields?.Name ?? "";
    if (!name || !map || map.startsWith("default/") || !typeName) return;
    const territory = f.TerritoryType?.row_id ?? f.TerritoryType?.value ?? 0;
    if (territory) dutyTerritories.add(territory);
    const kind = DUTY_KIND[typeName] ?? "other";
    places.push({
      id: `duty-${row.row_id}`,
      kind,
      name,
      region: f.TerritoryType?.fields?.PlaceNameRegion?.fields?.Name?.trim() || typeName,
      type: typeName,
      level: num(f.ClassJobLevelRequired),
      sync: num(f.ClassJobLevelSync),
      ilvl: num(f.ItemLevelRequired),
      party: f.ContentMemberType?.fields?.Name ?? "",
      map,
      size: num(f.TerritoryType?.fields?.Map?.fields?.SizeFactor) || 100,
      ox: num(f.TerritoryType?.fields?.Map?.fields?.OffsetX),
      oy: num(f.TerritoryType?.fields?.Map?.fields?.OffsetY),
    });
  },
);

for (const zone of territories) {
  if (dutyTerritories.has(zone.id) && zone.use !== 0 && zone.use !== 1 && zone.use !== 2) continue;
  const kind = USE_KIND[zone.use] ?? "zone";
  if (places.some((p) => p.map === zone.map && p.name === zone.name)) continue;
  places.push({
    id: `zone-${zone.id}`,
    kind,
    name: zone.name,
    region: zone.region,
    type: kind === "city" ? "City" : "Field",
    level: 0,
    sync: 0,
    ilvl: 0,
    party: "",
    map: zone.map,
    size: zone.size,
    ox: zone.ox,
    oy: zone.oy,
  });
}

console.log("npc shops");
/** @type {Map<number, {sheet: string, id: number}[]>} */
const npcShops = new Map();
await eachPage("ENpcBase", "ENpcData[].RowId", (row) => {
  const links = Array.isArray(row.fields.ENpcData) ? row.fields.ENpcData : [];
  const shops = [];
  for (const link of links) {
    if (link?.sheet && SHOPS.has(link.sheet) && link.row_id) shops.push({ sheet: link.sheet, id: link.row_id });
  }
  if (shops.length) npcShops.set(row.row_id, shops);
}, 200);
console.log(`  shop npcs ${npcShops.size}`);

console.log("positions");
/** @type {Map<string, object>} */
const pins = new Map();
await eachPage(
  "Level",
  "X,Z,Type,Object@as(raw),Map.Id,Map.SizeFactor,Map.OffsetX,Map.OffsetY",
  (row) => {
    const f = row.fields;
    if (f.Type !== 8) return;
    const npc = num(f["Object@as(raw)"]);
    if (!npcShops.has(npc)) return;
    const map = f.Map?.fields?.Id ?? "";
    if (!map || map.startsWith("default/")) return;
    const size = num(f.Map.fields.SizeFactor) || 100;
    const x = toPin(num(f.X), num(f.Map.fields.OffsetX), size);
    const y = toPin(num(f.Z), num(f.Map.fields.OffsetY), size);
    if (x.pct < -2 || x.pct > 102 || y.pct < -2 || y.pct > 102) return;
    const key = `${npc}|${map}|${x.game}|${y.game}`;
    if (pins.has(key)) return;
    pins.set(key, { npc, map, x: x.game, y: y.game, px: Math.min(100, Math.max(0, x.pct)), py: Math.min(100, Math.max(0, y.pct)) });
  },
);
console.log(`  pins ${pins.size}`);

console.log("names");
const ids = [...new Set([...pins.values()].map((p) => p.npc))];
/** @type {Map<number, {name: string, title: string}>} */
const names = new Map();
for (let i = 0; i < ids.length; i += 40) {
  const batch = ids.slice(i, i + 40);
  const url = new URL(`${API}/ENpcResident`);
  url.searchParams.set("rows", batch.join(","));
  url.searchParams.set("language", "en");
  url.searchParams.set("fields", "Singular,Title");
  const json = await getJson(url);
  const rows = json.rows ?? (json.row_id ? [json] : []);
  for (const row of rows) {
    const name = (row.fields?.Singular ?? "").trim();
    const title = (row.fields?.Title ?? "").trim();
    if (name) names.set(row.row_id, { name, title });
  }
  if (i % 400 === 0) console.log(`  names ${Math.min(i + 40, ids.length)}/${ids.length}`);
}

const gilIds = new Set();
const specialIds = new Set();
for (const pin of pins.values()) {
  if (!names.has(pin.npc)) continue;
  for (const shop of npcShops.get(pin.npc) ?? []) {
    if (shop.sheet === "GilShop") gilIds.add(shop.id);
    else if (shop.sheet === "SpecialShop") specialIds.add(shop.id);
  }
}

console.log(`gil shops ${gilIds.size}`);
/** @type {Map<number, {n: string, c: string}[]>} */
const gilItems = new Map();
await eachPage("GilShopItem", "Item.Name,Item.PriceMid", (row) => {
  if (!gilIds.has(row.row_id)) return;
  const name = row.fields.Item?.fields?.Name?.trim() ?? "";
  if (!name) return;
  const list = gilItems.get(row.row_id) ?? [];
  if (list.length < 30) {
    const price = num(row.fields.Item?.fields?.PriceMid);
    list.push({ n: name, c: price > 0 ? `${price.toLocaleString("en-US")} gil` : "" });
  }
  gilItems.set(row.row_id, list);
});

console.log(`other shops ${specialIds.size}`);
/** @type {Map<number, {n: string, c: string}[]>} */
const otherItems = new Map();
const specialList = [...specialIds];
for (let i = 0; i < specialList.length; i += 15) {
  const batch = specialList.slice(i, i + 15);
  const url = new URL(`${API}/SpecialShop`);
  url.searchParams.set("rows", batch.join(","));
  url.searchParams.set("language", "en");
  url.searchParams.set(
    "fields",
    "Name,Item[].Item[].Name,Item[].ItemCost[].Name,Item[].ReceiveCount,Item[].CurrencyCost",
  );
  let json;
  try {
    json = await getJson(url);
  } catch (error) {
    console.log("  special batch failed", error.message);
    continue;
  }
  const rows = json.rows ?? (json.row_id ? [json] : []);
  for (const row of rows) {
    const shopName = (row.fields?.Name ?? "").trim();
    const currency = shopName.replace(/\s*\([^)]*\)\s*$/, "");
    const slots = Array.isArray(row.fields?.Item) ? row.fields.Item : [];
    const list = [];
    for (const slot of slots) {
      const received = namesOf(slot.Item).filter(Boolean);
      if (!received.length) continue;
      const costs = namesOf(slot.ItemCost).filter((n) => n && n !== "Gil");
      const counts = Array.isArray(slot.ReceiveCount) ? slot.ReceiveCount : [];
      const amount = num(Array.isArray(slot.CurrencyCost) ? slot.CurrencyCost[0] : 0);
      const qty = num(counts[0]);
      const itemName = qty > 1 ? `${received[0]} ×${qty}` : received[0];
      let cost = costs.join(" + ");
      if (!cost && amount > 0) cost = `${amount.toLocaleString("en-US")} ${currency || "gil"}`;
      list.push({ n: itemName, c: cost });
      if (list.length >= 24) break;
    }
    if (list.length) otherItems.set(row.row_id, list);
  }
  if (i % 150 === 0) console.log(`  special ${Math.min(i + 15, specialList.length)}/${specialList.length}`);
}

// GC / allied shops are not SpecialShop rows. Pull them if the sheet exists.
for (const sheet of ["GCShop", "InclusionShop", "FccShop"]) {
  const wanted = new Set();
  for (const pin of pins.values()) {
    for (const shop of npcShops.get(pin.npc) ?? []) if (shop.sheet === sheet) wanted.add(shop.id);
  }
  if (!wanted.size) continue;
  console.log(sheet, wanted.size);
  const listIds = [...wanted];
  for (let i = 0; i < listIds.length; i += 20) {
    const url = new URL(`${API}/${sheet}`);
    url.searchParams.set("rows", listIds.slice(i, i + 20).join(","));
    url.searchParams.set("language", "en");
    url.searchParams.set("fields", "Item[].Item.Name,Item[].Item[].Name");
    try {
      const json = await getJson(url);
      const rows = json.rows ?? (json.row_id ? [json] : []);
      for (const row of rows) {
        const found = namesOf(row.fields?.Item).slice(0, 30).map((n) => ({ n, c: "" }));
        if (found.length) otherItems.set(row.row_id, found);
      }
    } catch (error) {
      console.log(`  ${sheet} skipped`, error.message.slice(0, 140));
      break;
    }
  }
}

const vendors = [];
for (const pin of pins.values()) {
  const who = names.get(pin.npc);
  if (!who) continue;
  const shops = npcShops.get(pin.npc) ?? [];
  const items = [];
  let shop = "Special";
  for (const entry of shops) {
    shop = SHOP_LABEL[entry.sheet] ?? shop;
    const stock = entry.sheet === "GilShop" ? gilItems.get(entry.id) : otherItems.get(entry.id);
    if (!stock) continue;
    for (const item of stock.slice(0, 12)) items.push(item);
  }
  const trimmed = [];
  const seenItem = new Set();
  for (const item of items) {
    if (seenItem.has(item.n)) continue;
    seenItem.add(item.n);
    trimmed.push(item);
    if (trimmed.length >= 36) break;
  }
  vendors.push({
    id: pin.npc,
    name: who.name,
    title: who.title,
    map: pin.map,
    x: pin.x,
    y: pin.y,
    px: Math.round(pin.px * 10) / 10,
    py: Math.round(pin.py * 10) / 10,
    shop,
    items: trimmed,
  });
}

places.sort((a, b) => a.region.localeCompare(b.region) || a.level - b.level || a.name.localeCompare(b.name));
vendors.sort((a, b) => a.name.localeCompare(b.name));

const atlas = {
  patch: "7.56",
  places,
  vendors,
};
const fs = await import("node:fs");
fs.writeFileSync("public/atlas.json", JSON.stringify(atlas));
fs.writeFileSync("public/atlas-places.json", JSON.stringify({ patch: atlas.patch, places }));
fs.writeFileSync("public/atlas-detail.json", JSON.stringify({ vendors, hunts: [] }));
const kinds = {};
for (const p of places) kinds[p.kind] = (kinds[p.kind] ?? 0) + 1;
console.log(JSON.stringify({ places: places.length, vendors: vendors.length, kinds, bytes: fs.statSync("public/atlas.json").size }));
const sample = vendors.find((v) => v.name === "Auriana") ?? vendors.find((v) => v.map.includes("r1f1"));
console.log("sample", sample && { name: sample.name, x: sample.x, y: sample.y, map: sample.map, items: sample.items.length });
const { spawnSync } = await import("node:child_process");
spawnSync(process.execPath, ["scripts/build-hunts.mjs"], { stdio: "inherit" });
