import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MARKET_IDS,
  MARKETS,
  formatGil,
  marketItemId,
  serverFor,
  worldsOn,
  type BoardQuote,
} from "@/lib/market";
import { readBoardPrices } from "@/lib/market-sync";
import type { RelicItem, RelicLine } from "@/lib/relics";
import { RELIC_LINES } from "@/lib/relics";
import { cn } from "@/lib/utils";

const SERVER_KEY = "reliquary-server";
const WORLD_KEY = "reliquary-world";
const FRESH_MS = 5 * 60 * 1000;
const ALL_IDS = Object.values(MARKET_IDS);

interface CacheEntry {
  at: number;
  prices: Record<number, BoardQuote>;
}

const cache = new Map<string, CacheEntry>();

interface MarketState {
  server: string;
  world: string;
  setServer: (server: string) => void;
  setWorld: (world: string) => void;
  quotes: Record<number, BoardQuote>;
  status: "loading" | "ready" | "error";
}

const MarketContext = createContext<MarketState | null>(null);

function storedChoice(): { server: string; world: string } {
  try {
    const savedServer = localStorage.getItem(SERVER_KEY) ?? localStorage.getItem("reliquary-board") ?? "";
    const server = serverFor(savedServer);
    const worlds = worldsOn(server);
    const savedWorld = localStorage.getItem(WORLD_KEY) ?? "";
    const remembered = worlds.includes(savedServer) ? savedServer : "";
    const world = worlds.includes(savedWorld) ? savedWorld : remembered || worlds[0] || "Adamantoise";
    return { server, world };
  } catch {
    return { server: "Aether", world: "Adamantoise" };
  }
}

function remember(server: string, world: string) {
  try {
    localStorage.setItem(SERVER_KEY, server);
    localStorage.setItem(WORLD_KEY, world);
  } catch {
    /* the choice still applies for this visit */
  }
}

export function MarketProvider({ children }: { children: ReactNode }) {
  const [server, setServerState] = useState("Aether");
  const [world, setWorldState] = useState("Adamantoise");
  const [quotes, setQuotes] = useState<Record<number, BoardQuote>>({});
  const [status, setStatus] = useState<MarketState["status"]>("loading");

  useEffect(() => {
    const choice = storedChoice();
    setServerState(choice.server);
    setWorldState(choice.world);
  }, []);

  useEffect(() => {
    const key = `${server}:${world}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < FRESH_MS) {
      setQuotes(hit.prices);
      setStatus("ready");
      return;
    }
    let cancel = false;
    setStatus("loading");
    void readBoardPrices({ data: { server, world, ids: ALL_IDS } })
      .then((result) => {
        if (cancel) return;
        const prices = result?.prices ?? {};
        cache.set(key, { at: Date.now(), prices });
        setQuotes(prices);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancel) setStatus("error");
      });
    return () => {
      cancel = true;
    };
  }, [server, world]);

  const setServer = (next: string) => {
    if (serverFor(next) !== next) return;
    const worlds = worldsOn(next);
    const nextWorld = worlds.includes(world) ? world : worlds[0] ?? world;
    setServerState(next);
    setWorldState(nextWorld);
    remember(next, nextWorld);
  };

  const setWorld = (next: string) => {
    if (!worldsOn(server).includes(next)) return;
    setWorldState(next);
    remember(server, next);
  };

  return (
    <MarketContext.Provider value={{ server, world, setServer, setWorld, quotes, status }}>
      {children}
    </MarketContext.Provider>
  );
}

function useMarket(): MarketState {
  const value = useContext(MarketContext);
  if (!value) throw new Error("Market prices are only available inside the tracker.");
  return value;
}

function tabClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
    active ? "bg-fg text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
  );
}

export function BoardSelect() {
  const { server, world, setServer, setWorld, status } = useMarket();
  const worlds = worldsOn(server);
  return (
    <div className="mt-4 space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {MARKETS.map((dc) => (
          <button key={dc.name} type="button" className={tabClass(server === dc.name)} onClick={() => setServer(dc.name)}>
            {dc.name}
          </button>
        ))}
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {worlds.map((name) => (
          <button key={name} type="button" className={tabClass(world === name)} onClick={() => setWorld(name)}>
            {name}
          </button>
        ))}
      </div>
      <p className="text-xs text-subtle">
        {status === "loading" ? `Checking ${world}` : status === "error" ? "Prices unavailable" : `${world} on ${server}`}
      </p>
    </div>
  );
}

function boardItems(line: RelicLine): RelicItem[] {
  const seen = new Set<string>();
  const rows: RelicItem[] = [];
  for (const stage of line.stages) {
    for (const item of stage.items) {
      if (!item.sources.includes("marketboard") || seen.has(item.id)) continue;
      seen.add(item.id);
      rows.push(item);
    }
  }
  return rows;
}

export function BoardView() {
  const groups = useMemo(
    () =>
      RELIC_LINES.map((line) => {
        const items = boardItems(line).sort(
          (a, b) => Number(marketItemId(b.id) != null) - Number(marketItemId(a.id) != null),
        );
        return { line, items };
      }).filter((group) => group.items.length > 0),
    [],
  );

  return (
    <section className="mt-6 min-w-0 overflow-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl text-fg">Market</h2>
          <p className="mt-1 text-sm text-muted">One tab per server, then one tab per world</p>
        </div>
      </div>
      <BoardSelect />
      <div className="mt-6 space-y-8">
        {groups.map(({ line, items }) => (
          <div key={line.id}>
            <h3 className="text-xs uppercase tracking-[0.16em] text-subtle">{line.expansion}</h3>
            <p className="mt-1 font-display text-2xl text-fg">{line.name}</p>
            <ul className="mt-2 divide-y divide-border">
              {items.map((item) => (
                <BoardRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function quoteLabel(quote: BoardQuote | undefined): string {
  if (!quote) return "No listings";
  const parts = [
    quote.nq != null ? formatGil(quote.nq) : null,
    quote.hq != null ? `HQ ${formatGil(quote.hq)}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "No listings";
}

function BoardRow({ item }: { item: RelicItem }) {
  const { world, quotes, status } = useMarket();
  const id = marketItemId(item.id);
  const quote = id ? quotes[id] : undefined;
  const label = quoteLabel(quote);

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">{item.name}</p>
        {!id && <p className="mt-1 text-xs text-subtle">Price depends on the job, so there is no single listing.</p>}
      </div>
      {id && (
        <p className="shrink-0 text-right text-base font-medium tabular text-market">
          {status === "loading" && !quote ? `Checking ${world}` : label}
        </p>
      )}
    </li>
  );
}
