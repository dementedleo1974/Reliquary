import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIGHT_PHASES } from "@/lib/fight-phases";
import {
  loadDetail,
  loadDrops,
  loadPlaces,
  loadPlans,
  mapSrc,
  peekDetail,
  peekPlaces,
  rememberedPlaces,
  type DutyDrop,
  type FightPlan,
  type NodeDrop,
} from "./atlas-load";

export type AtlasKind = "zone" | "city" | "dungeon" | "trial" | "raid" | "other";

export interface AtlasPlace {
  id: string;
  kind: AtlasKind;
  name: string;
  region: string;
  type: string;
  level: number;
  sync: number;
  ilvl: number;
  party: string;
  map: string;
  size: number;
  ox: number;
  oy: number;
}

export interface AtlasItem {
  n: string;
  c: string;
}

export interface AtlasVendor {
  id: number;
  name: string;
  title: string;
  map: string;
  x: number;
  y: number;
  px: number;
  py: number;
  shop: string;
  items: AtlasItem[];
}

export interface AtlasHunt {
  zone: string;
  area: string;
  mob: string;
  count: number;
  kind: "job" | "gc";
  who: string;
  rank: number;
  entry: number;
  need: string;
}

const REGION_ORDER = [
  "La Noscea",
  "The Black Shroud",
  "Thanalan",
  "Coerthas",
  "Mor Dhona",
  "Abalathia's Spine",
  "Dravania",
  "Gyr Abania",
  "Othard",
  "Hingashi",
  "Norvrandt",
  "Ilsabard",
  "The Northern Empty",
  "The Sea of Stars",
  "The World Unsundered",
  "Yok Tural",
  "Xak Tural",
  "Unlost World",
  "Bozja",
  "Occult Crescent",
  "Special",
];

const FILTERS: Array<{ id: AtlasKind | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "zone", label: "Zones" },
  { id: "city", label: "Cities" },
  { id: "dungeon", label: "Dungeons" },
  { id: "trial", label: "Trials" },
  { id: "raid", label: "Raids" },
  { id: "other", label: "Other" },
];

const KIND_LABEL: Record<AtlasKind, string> = {
  zone: "Zone",
  city: "City",
  dungeon: "Dungeon",
  trial: "Trial",
  raid: "Raid",
  other: "Duty",
};

const DIFF_ORDER = ["Normal", "Hard", "Extreme", "Savage", "Ultimate", "Unreal"];

function normName(name: string) {
  return name
    .toLowerCase()
    .replace(/['’:.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gamePct(game: number, size: number) {
  if (!Number.isFinite(game) || game <= 0) return null;
  const pct = (((size || 100) * (game - 1)) / 2 / 2048) * 100;
  if (pct < 0 || pct > 100) return null;
  return pct;
}

function MapStage({
  src,
  children,
  onError,
}: {
  src: string;
  children: React.ReactNode;
  onError: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; midX: number; midY: number } | null>(null);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });

  useEffect(() => {
    setView({ s: 1, x: 0, y: 0 });
  }, [src]);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setView((current) => {
        const next = Math.min(4, Math.max(1, current.s * (event.deltaY < 0 ? 1.15 : 0.87)));
        const scale = next / current.s;
        const x = px - (px - current.x) * scale;
        const y = py - (py - current.y) * scale;
        const minX = Math.min(0, rect.width - rect.width * next);
        const minY = Math.min(0, rect.height - rect.height * next);
        return {
          s: next,
          x: Math.min(0, Math.max(minX, x)),
          y: Math.min(0, Math.max(minY, y)),
        };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function fit(s: number, x: number, y: number, rect: DOMRect) {
    const next = Math.min(4, Math.max(1, s));
    const minX = Math.min(0, rect.width - rect.width * next);
    const minY = Math.min(0, rect.height - rect.height * next);
    return { s: next, x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) };
  }

  function fingerPair() {
    const pts = [...pointers.current.values()];
    if (pts.length < 2) return null;
    const a = pts[0]!;
    const b = pts[1]!;
    return { d: Math.hypot(a.x - b.x, a.y - b.y), midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 };
  }

  function endPointer(id: number) {
    pointers.current.delete(id);
    pinch.current = null;
    drag.current = null;
    if (pointers.current.size === 1) {
      const remaining = [...pointers.current.values()][0];
      if (!remaining) return;
      setView((current) => {
        drag.current = { x: current.x, y: current.y, px: remaining.x, py: remaining.y };
        return current;
      });
    }
  }

  function zoomBy(factor: number) {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    setView((current) => {
      const next = Math.min(4, Math.max(1, current.s * factor));
      const contentX = (midX - current.x) / current.s;
      const contentY = (midY - current.y) / current.s;
      return fit(next, midX - contentX * next, midY - contentY * next, rect);
    });
  }

  return (
    <div
      ref={frame}
      className="relative aspect-square touch-none overflow-hidden rounded-md bg-[#07080c] shadow-[var(--shadow-border)]"
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        event.currentTarget.setPointerCapture(event.pointerId);
        const pair = fingerPair();
        const rect = frame.current?.getBoundingClientRect();
        if (pair && rect) {
          drag.current = null;
          pinch.current = { d: pair.d, midX: pair.midX - rect.left, midY: pair.midY - rect.top };
          return;
        }
        setView((current) => {
          drag.current = { x: current.x, y: current.y, px: event.clientX, py: event.clientY };
          return current;
        });
      }}
      onPointerMove={(event) => {
        if (!pointers.current.has(event.pointerId)) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const rect = frame.current?.getBoundingClientRect();
        if (!rect) return;
        const pair = fingerPair();
        if (pair && pinch.current && pair.d > 0) {
          const midX = pair.midX - rect.left;
          const midY = pair.midY - rect.top;
          const start = pinch.current;
          setView((current) => {
            const nextS = Math.min(4, Math.max(1, current.s * (pair.d / start.d)));
            const contentX = (start.midX - current.x) / current.s;
            const contentY = (start.midY - current.y) / current.s;
            return fit(nextS, midX - contentX * nextS, midY - contentY * nextS, rect);
          });
          pinch.current = { d: pair.d, midX, midY };
          return;
        }
        const start = drag.current;
        if (!start) return;
        setView((current) => {
          const minX = Math.min(0, rect.width - rect.width * current.s);
          const minY = Math.min(0, rect.height - rect.height * current.s);
          return {
            ...current,
            x: Math.min(0, Math.max(minX, start.x + event.clientX - start.px)),
            y: Math.min(0, Math.max(minY, start.y + event.clientY - start.py)),
          };
        });
      }}
      onPointerUp={(event) => endPointer(event.pointerId)}
      onPointerCancel={(event) => endPointer(event.pointerId)}
    >
      <div
        className="absolute inset-0"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: "0 0" }}
      >
        <img
          key={src}
          src={src}
          alt=""
          decoding="async"
          fetchPriority="high"
          draggable={false}
          className="pointer-events-none h-full w-full object-contain"
          onError={onError}
        />
        {children}
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button
          type="button"
          aria-label="Zoom in"
          className="flex size-11 items-center justify-center rounded-md bg-bg/90 text-lg text-fg shadow-[var(--shadow-border)]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomBy(1.25)}
        >
          +
        </button>
        <button
          type="button"
          className="flex h-11 items-center justify-center rounded-md bg-bg/90 px-3 text-sm text-fg shadow-[var(--shadow-border)]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setView({ s: 1, x: 0, y: 0 })}
        >
          Reset
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          className="flex size-11 items-center justify-center rounded-md bg-bg/90 text-lg text-fg shadow-[var(--shadow-border)]"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => zoomBy(0.8)}
        >
          −
        </button>
      </div>
    </div>
  );
}

export function AtlasView({ livePatch = "" }: { livePatch?: string }) {
  const readyPlaces = peekPlaces();
  const readyDetail = peekDetail();
  const [places, setPlaces] = useState<AtlasPlace[]>(readyPlaces?.places ?? []);
  const [patch, setPatch] = useState(readyPlaces?.patch ?? "");
  const [vendors, setVendors] = useState<AtlasVendor[]>(readyDetail?.vendors ?? []);
  const [hunts, setHunts] = useState<AtlasHunt[]>(readyDetail?.hunts ?? []);
  const [duties, setDuties] = useState<DutyDrop[]>([]);
  const [nodes, setNodes] = useState<NodeDrop[]>([]);
  const [plans, setPlans] = useState<FightPlan[]>([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<AtlasKind | "all">("zone");
  const [query, setQuery] = useState("");
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [vendorKey, setVendorKey] = useState<string | null>(null);
  const [spot, setSpot] = useState<number | null>(null);
  const [panel, setPanel] = useState<"hunts" | "vendors" | "drops" | "plan">("hunts");
  const [huntKind, setHuntKind] = useState<"all" | "job" | "gc">("all");
  const detailRef = useRef<HTMLElement>(null);
  const [brokenMap, setBrokenMap] = useState(false);

  useEffect(() => {
    let cancel = false;
    const remembered = rememberedPlaces();
    if (remembered) {
      setPlaces(remembered.places);
      setPatch(remembered.patch);
    }
    void loadPlaces()
      .then((file) => {
        if (cancel) return;
        setPlaces(file.places);
        setPatch(file.patch);
      })
      .catch(() => {
        if (!cancel) setError("The map index could not be loaded.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (panel !== "hunts" && panel !== "vendors") return;
    let cancel = false;
    void loadDetail()
      .then((file) => {
        if (cancel) return;
        setVendors(file.vendors);
        setHunts(file.hunts);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [panel]);

  useEffect(() => {
    if (panel !== "drops") return;
    let cancel = false;
    void loadDrops()
      .then((file) => {
        if (cancel) return;
        setDuties(file.duties);
        setNodes(file.nodes);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [panel]);

  useEffect(() => {
    if (panel !== "plan") return;
    let cancel = false;
    void loadPlans()
      .then((file) => {
        if (!cancel) setPlans(file);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, [panel]);

  useEffect(() => {
    if (placeId || places.length === 0) return;
    const preferred =
      places.find((p) => p.name === "Middle La Noscea") ?? places.find((p) => p.kind === "zone");
    if (preferred) setPlaceId(preferred.id);
  }, [places, placeId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((place) => {
      if (filter !== "all" && place.kind !== filter) return false;
      if (!q) return true;
      return (
        place.name.toLowerCase().includes(q) ||
        place.region.toLowerCase().includes(q) ||
        place.type.toLowerCase().includes(q)
      );
    });
  }, [places, filter, query]);

  const vendorsByMap = useMemo(() => {
    const grouped = new Map<string, AtlasVendor[]>();
    for (const vendor of vendors) {
      const list = grouped.get(vendor.map);
      if (list) list.push(vendor);
      else grouped.set(vendor.map, [vendor]);
    }
    return grouped;
  }, [vendors]);
  const huntsByName = useMemo(() => {
    const grouped = new Map<string, AtlasHunt[]>();
    for (const hunt of hunts) {
      const keys = hunt.zone === hunt.area ? [hunt.zone] : [hunt.zone, hunt.area];
      for (const key of keys) {
        if (!key) continue;
        const list = grouped.get(key);
        if (list) list.push(hunt);
        else grouped.set(key, [hunt]);
      }
    }
    return grouped;
  }, [hunts]);
  const place = places.find((p) => p.id === placeId) ?? visible[0] ?? null;
  const here = place ? (vendorsByMap.get(place.map) ?? []) : [];
  const zoneHunts = useMemo(() => {
    if (!place) return [];
    const list = huntsByName.get(place.name) ?? [];
    if (huntKind === "all") return list;
    return list.filter((hunt) => hunt.kind === huntKind);
  }, [huntsByName, place, huntKind]);
  const huntAreas = useMemo(() => {
    const grouped = new Map<string, AtlasHunt[]>();
    for (const hunt of zoneHunts) {
      const list = grouped.get(hunt.area) ?? [];
      list.push(hunt);
      list.sort((a, b) => a.entry - b.entry || a.who.localeCompare(b.who));
      grouped.set(hunt.area, list);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [zoneHunts]);
  const groups = useMemo(() => {
    const grouped = new Map<string, AtlasPlace[]>();
    for (const item of visible) {
      const list = grouped.get(item.region) ?? [];
      list.push(item);
      grouped.set(item.region, list);
    }
    return [...grouped.entries()]
      .sort((a, b) => {
        const ai = REGION_ORDER.indexOf(a[0]);
        const bi = REGION_ORDER.indexOf(b[0]);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || a[0].localeCompare(b[0]);
      })
      .map(([region, items]) => ({
        region,
        items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [visible]);
  const vendor = here.find((v, i) => `${v.id}-${i}` === vendorKey) ?? null;
  const duty = useMemo(() => {
    if (!place) return null;
    const key = normName(place.name);
    return duties.find((item) => normName(item.n) === key) ?? null;
  }, [duties, place]);
  const difficulties = useMemo(() => {
    if (!duty) return [];
    return duties
      .filter((item) => item.g === duty.g)
      .sort((a, b) => DIFF_ORDER.indexOf(a.d) - DIFF_ORDER.indexOf(b.d) || a.lv - b.lv);
  }, [duties, duty]);
  const zoneNodes = useMemo(
    () => (place ? nodes.filter((node) => node.z === place.name) : []),
    [nodes, place],
  );
  const plan = useMemo(() => {
    if (!place) return null;
    const key = normName(place.name);
    return plans.find((item) => normName(item.n) === key) ?? null;
  }, [plans, place]);

  useEffect(() => {
    setBrokenMap(false);
    setVendorKey(null);
    setSpot(null);
    if (place && /\((Savage|Ultimate|Chaotic)\)/.test(place.name)) setPanel("plan");
    else if (place && (place.kind === "dungeon" || place.kind === "trial" || place.kind === "raid")) setPanel("drops");
  }, [place]);

  if (error && places.length === 0) return <p className="mt-8 text-sm text-muted">{error}</p>;
  if (places.length === 0) return <p className="mt-8 text-sm text-muted">Loading maps…</p>;

  return (
    <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <div className="min-w-0">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a zone"
            className="h-11 w-full rounded-md bg-surface pl-9 pr-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-accent/60"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
                filter === item.id ? "bg-fg text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-subtle">
          {visible.length} shown · patch {patch}
          {livePatch ? ` · live ${livePatch}` : ""}
        </p>
        <ul className="mt-2 max-h-64 space-y-3 overflow-y-auto overscroll-y-contain pr-1 lg:max-h-[calc(100dvh-16rem)]">
          {groups.map((group) => (
            <li key={group.region}>
              <p className="px-3 pb-1 text-[0.65rem] uppercase tracking-[0.16em] text-subtle">{group.region}</p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-atlas-selected={place?.id === item.id ? "true" : "false"}
                      onClick={() => {
                        setPlaceId(item.id);
                        if (window.matchMedia("(max-width: 1023px)").matches) {
                          requestAnimationFrame(() => {
                            detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }
                      }}
                      className={cn(
                        "min-h-12 w-full rounded-md px-3 py-3 text-left",
                        place?.id === item.id ? "bg-surface-2 shadow-[var(--shadow-border)]" : "hover:bg-surface",
                      )}
                    >
                      <span className="block text-sm text-fg">{item.name}</span>
                      <span className="mt-0.5 block text-xs text-subtle">
                        {KIND_LABEL[item.kind]}
                        {item.level > 0 ? ` · Lv ${item.level}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {place ? (
        <section ref={detailRef} className="min-w-0 scroll-mt-24 rounded-lg bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
                {place.type || KIND_LABEL[place.kind]} · {place.region}
              </p>
              <h2 className="font-display text-3xl text-fg">{place.name}</h2>
            </div>
            <p className="text-sm text-muted">
              {place.level > 0 && <span>Level {place.level}</span>}
              {place.sync > 0 && place.sync !== place.level && <span> · sync {place.sync}</span>}
              {place.ilvl > 0 && <span> · iLvl {place.ilvl}</span>}
              {place.party && <span> · {place.party}</span>}
              {zoneHunts.length > 0 && <span> · {zoneHunts.length} hunts</span>}
              {here.length > 0 && (
                <span>
                  {(place.level > 0 || place.party || zoneHunts.length > 0) && " · "}
                  {here.length} vendors
                </span>
              )}
            </p>
          </div>

          <div className="mt-4 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)]">
          {brokenMap || !mapSrc(place.map) ? (
            <div className="flex aspect-square items-center justify-center rounded-md bg-[#07080c] text-sm text-muted shadow-[var(--shadow-border)]">
              Map image unavailable
            </div>
          ) : (
            <MapStage src={mapSrc(place.map)} onError={() => setBrokenMap(true)}>
              {here.map((v, i) => {
                const key = `${v.id}-${i}`;
                const on = vendorKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={`${v.name} (${v.x}, ${v.y})`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      setVendorKey(key);
                      setPanel("vendors");
                    }}
                    className={cn(
                      "absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                      on && "z-10",
                    )}
                    style={{ left: `${v.px}%`, top: `${v.py}%` }}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full border border-[#0b0c10] bg-accent shadow",
                        on && "size-4 ring-2 ring-fg",
                      )}
                    />
                  </button>
                );
              })}
              {duty?.coffers.map((coffer, index) => {
                if (coffer.x == null || coffer.y == null) return null;
                const left = gamePct(coffer.x, place.size);
                const top = gamePct(coffer.y, place.size);
                if (left == null || top == null) return null;
                const on = spot === index;
                return (
                  <button
                    key={`coffer-${index}`}
                    type="button"
                    title={`Coffer ${index + 1} (${coffer.x}, ${coffer.y})`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => {
                      setSpot(index);
                      setPanel("drops");
                    }}
                    className={cn(
                      "absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center",
                      on && "z-10",
                    )}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-sm border border-[#0b0c10] bg-[#e0b15a] shadow",
                        on && "size-4 ring-2 ring-fg",
                      )}
                    />
                  </button>
                );
              })}
              {zoneNodes.map((node, index) => {
                const left = gamePct(node.x, place.size);
                const top = gamePct(node.y, place.size);
                if (left == null || top == null) return null;
                return (
                  <button
                    key={`node-${node.n}-${index}`}
                    type="button"
                    title={`${node.n} · ${node.k} (${node.x}, ${node.y})`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => setPanel("drops")}
                    className="absolute flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <span className="size-2.5 rounded-full border border-[#0b0c10] bg-[#7dcea0] shadow" />
                  </button>
                );
              })}
            </MapStage>
          )}

          <div className="min-w-0">
          <p className="mb-2 text-xs text-subtle">Drag to pan. Pinch, scroll, or use the buttons to zoom.</p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap rounded-md bg-bg p-1">
              {(["plan", "drops", "hunts", "vendors"] as const)
                .filter((id) => id !== "plan" || plan)
                .map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPanel(id)}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-3 text-sm",
                    panel === id ? "bg-fg text-accent-fg" : "text-muted",
                  )}
                >
                  {id === "hunts" ? "Hunts" : id === "vendors" ? "Vendors" : id === "drops" ? "Drops" : "Plan"}
                </button>
              ))}
            </div>
            {panel === "hunts" &&
              (["all", "job", "gc"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHuntKind(id)}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
                    huntKind === id ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]" : "text-muted",
                  )}
                >
                  {id === "all" ? "All" : id === "job" ? "Jobs" : "Company"}
                </button>
              ))}
          </div>

          {panel === "plan" && plan ? (
            <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
              {(FIGHT_PHASES[plan.n] ?? []).length > 0 ? (
                <ol className="space-y-2">
                  {(FIGHT_PHASES[plan.n] ?? []).map((phase, index) => (
                    <li key={phase.name} className="rounded-md bg-bg px-3 py-2">
                      <p className="text-sm text-fg">
                        <span className="mr-2 text-xs tabular text-subtle">{index + 1}</span>
                        {phase.name}
                      </p>
                      <p className="mt-1 text-xs text-accent">{phase.pf}</p>
                      <p className="mt-1 text-sm text-muted">Wipe: {phase.wipe}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">
                  No phase card for this duty yet. Use one Party Finder strat and the links below. Do not mix two plans in the same pull.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {plan.links.map((link) => (
                  <a
                    key={link.u}
                    href={link.u}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-md bg-surface-2 px-3 text-sm text-accent"
                  >
                    {link.s}
                  </a>
                ))}
              </div>
            </div>
          ) : panel === "drops" ? (
            <div className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto">
              {difficulties.length > 1 && (
                <div className="flex flex-wrap gap-1">
                  {difficulties.map((item) => (
                    <button
                      key={item.n}
                      type="button"
                      onClick={() => {
                        const next = places.find((candidate) => normName(candidate.name) === normName(item.n));
                        if (next) setPlaceId(next.id);
                      }}
                      className={cn(
                        "inline-flex min-h-11 items-center rounded-full px-4 text-sm",
                        duty?.n === item.n ? "bg-surface-2 text-fg shadow-[var(--shadow-border)]" : "text-muted",
                      )}
                    >
                      {item.d}
                      {item.lv > 0 ? ` · ${item.lv}` : ""}
                    </button>
                  ))}
                </div>
              )}
              {!duty && zoneNodes.length === 0 && (
                <p className="text-sm text-muted">No recorded drops for this place.</p>
              )}
              {duty && (
                <div className="space-y-4">
                  <p className="text-xs text-subtle">
                    {duty.d}
                    {duty.lv > 0 ? ` · level ${duty.lv}` : ""}
                    {duty.sy > 0 && duty.sy !== duty.lv ? ` · sync ${duty.sy}` : ""}
                    {" · gold pins are coffers"}
                  </p>
                  {duty.coffers.map((coffer, index) => (
                    <section key={`coffer-list-${index}`}>
                      <button
                        type="button"
                        onClick={() => setSpot(index)}
                        className={cn(
                          "block min-h-11 py-2 text-left text-xs uppercase tracking-[0.16em]",
                          spot === index ? "text-fg" : "text-subtle",
                        )}
                      >
                        Coffer {index + 1}
                        {coffer.x != null ? ` · ${coffer.x}, ${coffer.y}` : ""}
                      </button>
                      <ul className="mt-1 divide-y divide-border">
                        {coffer.items.map((item) => (
                          <li key={item} className="py-1.5 text-sm text-fg">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  {duty.fights.map((fight, index) => (
                    <section key={`fight-${index}`}>
                      <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">{fight.t}</h3>
                      <ul className="mt-1 divide-y divide-border">
                        {fight.items.map((item) => (
                          <li key={item} className="py-1.5 text-sm text-fg">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                  {duty.extra.length > 0 && (
                    <section>
                      <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">Also awarded</h3>
                      <ul className="mt-1 divide-y divide-border">
                        {duty.extra.map((item) => (
                          <li key={item} className="py-1.5 text-sm text-fg">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
              {zoneNodes.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs text-subtle">Green pins are gathering nodes.</p>
                  {zoneNodes.map((node, index) => (
                    <section key={`${node.n}-${node.k}-${index}`}>
                      <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
                        {node.k} · {node.n}
                        {node.lv > 0 ? ` · Lv ${node.lv}` : ""} · {node.x}, {node.y}
                      </h3>
                      <ul className="mt-1 divide-y divide-border">
                        {node.items.map((item) => (
                          <li key={item} className="py-1.5 text-sm text-fg">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          ) : panel === "hunts" ? (
            <div className="mt-4 max-h-[28rem] space-y-4 overflow-y-auto">
              {huntAreas.length === 0 && (
                <p className="text-sm text-muted">No hunting-log mobs in this place.</p>
              )}
              {huntAreas.map(([area, list]) => (
                <section key={area}>
                  <h3 className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">{area}</h3>
                  <ul className="mt-1 divide-y divide-border">
                    {list.map((hunt) => (
                      <li
                        key={`${hunt.who}-${hunt.entry}-${hunt.mob}`}
                        className="flex items-baseline justify-between gap-3 py-2"
                      >
                        <span className="text-sm text-fg">
                          {hunt.mob}
                          <span className="tabular text-muted"> ×{hunt.count}</span>
                        </span>
                        <span className="text-right text-xs text-muted">
                          {hunt.who} · Rank {hunt.rank}
                          {hunt.need ? ` · ${hunt.need}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {here.length === 0 && <li className="text-sm text-muted">No vendors on this map.</li>}
              {here.map((v, i) => {
                const key = `${v.id}-${i}`;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setVendorKey(key)}
                      className={cn(
                        "min-h-12 w-full rounded-md px-3 py-3 text-left",
                        vendorKey === key ? "bg-surface-2 shadow-[var(--shadow-border)]" : "hover:bg-surface-2",
                      )}
                    >
                      <span className="block text-sm text-fg">{v.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-xs tabular text-accent">
                        <MapPin className="size-3" />
                        {v.x}, {v.y}
                        <span className="text-subtle">· {v.shop}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="min-w-0">
              {vendor ? (
                <>
                  <h3 className="text-sm font-medium text-fg">{vendor.name}</h3>
                  {vendor.title && <p className="text-xs text-subtle">{vendor.title}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {vendor.shop}
                    {vendor.items.length >= 36 ? " · first 36 items" : ""}
                  </p>
                  <ul className="mt-3 max-h-72 divide-y divide-border overflow-y-auto">
                    {vendor.items.length === 0 && (
                      <li className="py-2 text-sm text-muted">No listed stock for this shop.</li>
                    )}
                    {vendor.items.map((item) => (
                      <li key={item.n} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                        <span className="text-fg">{item.n}</span>
                        {item.c && <span className="shrink-0 text-xs tabular text-muted">{item.c}</span>}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">Select a pin to see what that vendor sells.</p>
              )}
            </div>
          </div>
          )}
          </div>
          </div>
        </section>
      ) : (
        <p className="mt-8 text-sm text-muted">No maps match that search.</p>
      )}
    </div>
  );
}
