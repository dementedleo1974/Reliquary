import { createFileRoute } from "@tanstack/react-router";
import { Buffer } from "node:buffer";

const TERRITORY = /^[a-z0-9]{1,12}$/;
const INDEX = /^\d{2}$/;
const MAX_BYTES = 1_500_000;
const cache = new Map<string, Uint8Array>();

function image(bytes: Uint8Array) {
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": "image/jpeg",
      "cache-control": "public, max-age=604800, immutable",
    },
  });
}

export const Route = createFileRoute("/maps/$territory/$index")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const territory = params.territory;
        const index = params.index;
        if (!TERRITORY.test(territory) || !INDEX.test(index)) {
          return new Response(null, { status: 404 });
        }
        const key = `${territory}/${index}`;
        const hit = cache.get(key);
        if (hit) return image(hit);
        try {
          const upstream = await fetch(`https://v2.xivapi.com/api/asset/map/${key}?format=jpg`, {
            method: "GET",
            redirect: "error",
            signal: AbortSignal.timeout(12000),
            headers: { Accept: "image/jpeg", "User-Agent": "Reliquary/1.0" },
          });
          if (!upstream.ok) return new Response(null, { status: 404 });
          const type = upstream.headers.get("content-type") ?? "";
          if (!type.includes("image/jpeg")) return new Response(null, { status: 404 });
          const bytes = new Uint8Array(await upstream.arrayBuffer());
          if (bytes.byteLength < 1000 || bytes.byteLength > MAX_BYTES) {
            return new Response(null, { status: 404 });
          }
          if (cache.size >= 48) {
            const oldest = cache.keys().next().value;
            if (oldest) cache.delete(oldest);
          }
          cache.set(key, bytes);
          return image(bytes);
        } catch {
          return new Response(null, { status: 404 });
        }
      },
    },
  },
});
