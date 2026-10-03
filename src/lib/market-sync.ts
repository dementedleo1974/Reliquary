import { createServerFn } from "@tanstack/react-start";
import { isKnownServer, isWorldOn, knownItemIds, parseBoardPrices, type BoardQuote } from "@/lib/market";

const MAX_BODY = 80_000;

async function worldPrices(world: string, ids: number[]): Promise<Record<number, BoardQuote>> {
  const url = `https://universalis.app/api/v2/${encodeURIComponent(world)}/${ids.join(",")}?listings=0&entries=0`;
  const res = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json", "User-Agent": "Reliquary/1.0" },
  });
  if (!res.ok) return {};
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return {};
  const text = await res.text();
  if (text.length > MAX_BODY) return {};
  return parseBoardPrices(JSON.parse(text), ids);
}

/**
 * Lowest public price on one world. The world must belong to the named server.
 * Item ids are fixed. Listings and sale history are not stored.
 */
export const readBoardPrices = createServerFn({ method: "POST" })
  .validator((input: unknown) => {
    if (typeof input !== "object" || input === null) throw new Error("Unknown world.");
    const server = (input as { server?: unknown }).server;
    const world = (input as { world?: unknown }).world;
    const ids = knownItemIds((input as { ids?: unknown }).ids);
    if (typeof server !== "string" || typeof world !== "string") throw new Error("Unknown world.");
    if (!isKnownServer(server) || !isWorldOn(server, world) || ids.length === 0) {
      throw new Error("Unknown world.");
    }
    return { server, world, ids };
  })
  .handler(async ({ data }): Promise<{ world: string; prices: Record<number, BoardQuote> }> => {
    try {
      return { world: data.world, prices: await worldPrices(data.world, data.ids) };
    } catch {
      return { world: data.world, prices: {} };
    }
  });

