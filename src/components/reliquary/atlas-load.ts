import type { AtlasHunt, AtlasPlace, AtlasVendor } from "./atlas";

const PLACES_KEY = "reliquary-places";
const MAP_ID = /^[a-z0-9]+\/\d{2}$/;

interface PlacesFile {
  patch: string;
  places: AtlasPlace[];
}

interface DetailFile {
  vendors: AtlasVendor[];
  hunts: AtlasHunt[];
}

let placesCache: PlacesFile | null = null;
let detailCache: DetailFile | null = null;
let placesPromise: Promise<PlacesFile> | null = null;
let detailPromise: Promise<DetailFile> | null = null;

export function mapSrc(map: string) {
  if (!MAP_ID.test(map)) return "";
  const [territory, index] = map.split("/");
  return `/maps/${territory}/${index}`;
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
  placesPromise ??= readJson("/atlas-places.json", 400_000)
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
  detailPromise ??= readJson("/atlas-detail.json", 1_200_000)
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

/** Starts the zone list and the first map before The World is opened. */
export function prefetchAtlas() {
  void loadPlaces()
    .then((file) => {
      const first =
        file.places.find((place) => place.name === "Middle La Noscea") ??
        file.places.find((place) => place.kind === "zone");
      const src = first ? mapSrc(first.map) : "";
      if (!src) return;
      const image = new Image();
      image.decoding = "async";
      image.src = src;
    })
    .catch(() => {});
  void loadDetail().catch(() => {});
}
