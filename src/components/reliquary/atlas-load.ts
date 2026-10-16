import type { AtlasHunt, AtlasPlace, AtlasVendor } from "./atlas";
import { publicPath } from "@/lib/public-path";

const PLACES_KEY = "reliquary-places";
const MAP_ID = /^[a-z0-9]+\/\d{2}$/;

interface PlacesFile {
  patch: string;
  places: AtlasPlace[];
}

export interface DutyDrop {
  n: string;
  d: string;
  g: string;
  lv: number;
  sy: number;
  coffers: Array<{ x?: number; y?: number; items: string[] }>;
  fights: Array<{ t: string; items: string[] }>;
  extra: string[];
}

export interface NodeDrop {
  z: string;
  n: string;
  k: string;
  lv: number;
  x: number;
  y: number;
  items: string[];
}

export interface DropsFile {
  duties: DutyDrop[];
  nodes: NodeDrop[];
}

interface DetailFile {
  vendors: AtlasVendor[];
  hunts: AtlasHunt[];
}

let placesCache: PlacesFile | null = null;
let detailCache: DetailFile | null = null;
let placesPromise: Promise<PlacesFile> | null = null;
let detailPromise: Promise<DetailFile> | null = null;
export interface FightPlan {
  n: string;
  pf: string;
  steps: string[];
  links: Array<{ s: string; u: string }>;
}

let plansCache: FightPlan[] | null = null;
let plansPromise: Promise<FightPlan[]> | null = null;
let dropsCache: DropsFile | null = null;
let dropsPromise: Promise<DropsFile> | null = null;

export function mapSrc(map: string) {
  if (!MAP_ID.test(map)) return "";
  const [territory, index] = map.split("/");
  return publicPath(`/maps/${territory}/${index}.jpg`);
}

export function peekPlaces(): PlacesFile | null {
  return placesCache;
}

export function peekDetail(): DetailFile | null {
  return detailCache;
}

function asPlaces(input: unknown): PlacesFile | null {
  if (typeof input !== "object" || input === null) return null;
  const patch = (input as { patch?: unknown }).patch;
  const places = (input as { places?: unknown }).places;
  if (typeof patch !== "string" || patch.length > 16 || !Array.isArray(places) || places.length > 2_000) return null;
  return { patch, places: places as AtlasPlace[] };
}

async function readJson(url: string, max: number): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("missing");
  const text = await res.text();
  if (text.length > max) throw new Error("missing");
  return JSON.parse(text);
}

export function rememberedPlaces(): PlacesFile | null {
  try {
    const raw = sessionStorage.getItem(PLACES_KEY);
    if (!raw || raw.length > 400_000) return null;
    return asPlaces(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadPlaces(): Promise<PlacesFile> {
  if (placesCache) return Promise.resolve(placesCache);
  placesPromise ??= readJson(publicPath("/atlas-places.json"), 400_000)
    .then((json) => {
      const places = asPlaces(json);
      if (!places) throw new Error("missing");
      placesCache = places;
      try {
        sessionStorage.setItem(PLACES_KEY, JSON.stringify(places));
      } catch {
        /* a full tab can skip the memory of the list */
      }
      return places;
    })
    .finally(() => {
      placesPromise = null;
    });
  return placesPromise;
}

export function loadDetail(): Promise<DetailFile> {
  if (detailCache) return Promise.resolve(detailCache);
  detailPromise ??= readJson(publicPath("/atlas-detail.json"), 1_200_000)
    .then((json) => {
      const vendors = (json as { vendors?: unknown }).vendors;
      const hunts = (json as { hunts?: unknown }).hunts;
      if (!Array.isArray(vendors) || vendors.length > 2_000) throw new Error("missing");
      const detail = {
        vendors: vendors as AtlasVendor[],
        hunts: Array.isArray(hunts) ? (hunts as AtlasHunt[]).slice(0, 2_000) : [],
      };
      detailCache = detail;
      return detail;
    })
    .finally(() => {
      detailPromise = null;
    });
  return detailPromise;
}

export function loadDrops(): Promise<DropsFile> {
  if (dropsCache) return Promise.resolve(dropsCache);
  dropsPromise ??= readJson(publicPath("/drops.json"), 2_500_000)
    .then((json) => {
      const duties = (json as { duties?: unknown }).duties;
      const nodes = (json as { nodes?: unknown }).nodes;
      if (!Array.isArray(duties) || !Array.isArray(nodes)) throw new Error("missing");
      if (duties.length > 2_000 || nodes.length > 3_000) throw new Error("missing");
      const drops = { duties: duties as DutyDrop[], nodes: nodes as NodeDrop[] };
      dropsCache = drops;
      return drops;
    })
    .finally(() => {
      dropsPromise = null;
    });
  return dropsPromise;
}

export function loadPlans(): Promise<FightPlan[]> {
  if (plansCache) return Promise.resolve(plansCache);
  plansPromise ??= readJson(publicPath("/strategies.json"), 800_000)
    .then((json) => {
      const plans = (json as { plans?: unknown }).plans;
      if (!Array.isArray(plans) || plans.length > 400) throw new Error("missing");
      const clean = plans.filter((plan): plan is FightPlan => {
        if (typeof plan !== "object" || plan === null) return false;
        const row = plan as FightPlan;
        return typeof row.n === "string" && typeof row.pf === "string" && Array.isArray(row.steps) && Array.isArray(row.links);
      });
      plansCache = clean;
      return clean;
    })
    .finally(() => {
      plansPromise = null;
    });
  return plansPromise;
}
