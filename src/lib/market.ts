/** Public Market Board item ids for materials that are the same on every job. */
export const MARKET_IDS: Record<string, number> = {
  francesca: 13589,
  mirror: 13591,
  arrow: 13593,
  kingcake: 13595,
  "crystal-sand": 15841,
  siderite: 46852,
  "sdm-a": 46855,
  "sdm-b": 46856,
  "sdm-g": 46857,
  "aether-agg": 50055,
  "aether-cond": 50056,
  "aether-cat": 50057,
  alloy: 50972,
  twin: 50971,
  polish: 50973,
};

const MARKET_ID_SET = new Set(Object.values(MARKET_IDS));

export interface MarketDc {
  region: string;
  name: string;
  worlds: string[];
}

/** English-language data centers. Cloud test and other regions stay out of the picker. */
export const MARKETS: MarketDc[] = [
  { region: "North America", name: "Aether", worlds: ["Adamantoise", "Cactuar", "Faerie", "Gilgamesh", "Jenova", "Midgardsormr", "Sargatanas", "Siren"] },
  { region: "North America", name: "Primal", worlds: ["Behemoth", "Excalibur", "Exodus", "Famfrit", "Hyperion", "Lamia", "Leviathan", "Ultros"] },
  { region: "North America", name: "Crystal", worlds: ["Balmung", "Brynhildr", "Coeurl", "Diabolos", "Goblin", "Malboro", "Mateus", "Zalera"] },
  { region: "North America", name: "Dynamis", worlds: ["Cuchulainn", "Golem", "Halicarnassus", "Kraken", "Maduin", "Marilith", "Rafflesia", "Seraph"] },
  { region: "Europe", name: "Chaos", worlds: ["Cerberus", "Louisoix", "Moogle", "Omega", "Phantom", "Ragnarok", "Sagittarius", "Spriggan"] },
  { region: "Europe", name: "Light", worlds: ["Alpha", "Lich", "Odin", "Phoenix", "Raiden", "Shiva", "Twintania", "Zodiark"] },
  { region: "Oceania", name: "Materia", worlds: ["Bismarck", "Ravana", "Sephirot", "Sophia", "Zurvan"] },
  { region: "Japan", name: "Elemental", worlds: ["Aegis", "Atomos", "Carbuncle", "Garuda", "Gungnir", "Kujata", "Tonberry", "Typhon"] },
  { region: "Japan", name: "Gaia", worlds: ["Alexander", "Bahamut", "Durandal", "Fenrir", "Ifrit", "Ridill", "Tiamat", "Ultima"] },
  { region: "Japan", name: "Mana", worlds: ["Anima", "Asura", "Chocobo", "Hades", "Ixion", "Masamune", "Pandaemonium", "Titan"] },
  { region: "Japan", name: "Meteor", worlds: ["Belias", "Mandragora", "Ramuh", "Shinryu", "Unicorn", "Valefor", "Yojimbo", "Zeromus"] },
];

export function marketItemId(itemId: string): number | undefined {
  return MARKET_IDS[itemId];
}

export function isKnownServer(name: string): boolean {
  return MARKETS.some((dc) => dc.name === name);
}

/** A saved world still maps back to its data center. */
export function serverFor(name: string): string {
  if (isKnownServer(name)) return name;
  const found = MARKETS.find((dc) => dc.worlds.includes(name));
  return found?.name ?? "Aether";
}

export function worldsOn(server: string): string[] {
  return MARKETS.find((dc) => dc.name === server)?.worlds ?? [];
}

export function isWorldOn(server: string, world: string): boolean {
  return worldsOn(server).includes(world);
}

export function knownItemIds(ids: unknown): number[] {
  if (!Array.isArray(ids)) return [];
  const out: number[] = [];
  for (const id of ids) {
    if (!Number.isInteger(id) || !MARKET_ID_SET.has(id as number)) continue;
    if (!out.includes(id as number)) out.push(id as number);
    if (out.length >= 40) break;
  }
  return out;
}

export interface BoardQuote {
  nq: number | null;
  hq: number | null;
}

function priceOf(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function quoteFrom(entry: unknown): BoardQuote | null {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return null;
  const row = entry as { minPrice?: unknown; minPriceNQ?: unknown; minPriceHQ?: unknown };
  const nq = priceOf(row.minPriceNQ) ?? priceOf(row.minPrice);
  const hq = priceOf(row.minPriceHQ);
  if (nq == null && hq == null) return null;
  return { nq, hq };
}

/** Keeps only unit prices for item ids we asked for. */
export function parseBoardPrices(input: unknown, allowed: number[]): Record<number, BoardQuote> {
  const allow = new Set(allowed);
  const quotes: Record<number, BoardQuote> = {};
  if (typeof input !== "object" || input === null) return quotes;
  const body = input as { items?: unknown; itemID?: unknown };
  const items = body.items;
  if (typeof items === "object" && items !== null && !Array.isArray(items)) {
    for (const [key, value] of Object.entries(items)) {
      const id = Number(key);
      if (!allow.has(id)) continue;
      const quote = quoteFrom(value);
      if (quote) quotes[id] = quote;
    }
    return quotes;
  }
  const single = Number(body.itemID);
  if (allow.has(single)) {
    const quote = quoteFrom(body);
    if (quote) quotes[single] = quote;
  }
  return quotes;
}

export function formatGil(amount: number): string {
  return `${amount.toLocaleString("en-US")} gil`;
}
