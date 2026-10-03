import { createServerFn } from "@tanstack/react-start";
import { isPatchName, parseLivePatch } from "@/lib/game-patch";

const VERSION_URL = "https://v2.xivapi.com/api/version";
const MAX_BODY = 64_000;

/**
 * Reads the public game-file version. The address is fixed. The body is size-capped
 * and reduced to a patch string. Nothing from the response is executed or stored raw.
 */
export const readLiveGamePatch = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await fetch(VERSION_URL, {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json", "User-Agent": "Reliquary/1.0" },
    });
    if (!res.ok) return { patch: null };
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) return { patch: null };
    const text = await res.text();
    if (text.length > MAX_BODY) return { patch: null };
    const patch = parseLivePatch(JSON.parse(text));
    return { patch: patch && isPatchName(patch) ? patch : null };
  } catch {
    return { patch: null };
  }
});
