import { useEffect, useState } from "react";
import { isPatchName } from "@/lib/game-patch";
import { readLiveGamePatch } from "@/lib/game-sync";

const STORAGE_KEY = "reliquary-game-patch";
const FRESH_MS = 6 * 60 * 60 * 1000;

interface Stamp {
  patch: string;
  at: number;
}

function readStamp(): Stamp | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw || raw.length > 80) return null;
    const data = JSON.parse(raw) as { patch?: unknown; at?: unknown };
    if (typeof data.patch !== "string" || !isPatchName(data.patch)) return null;
    if (typeof data.at !== "number" || !Number.isFinite(data.at)) return null;
    return { patch: data.patch, at: data.at };
  } catch {
    return null;
  }
}

function writeStamp(patch: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ patch, at: Date.now() }));
  } catch {
    /* private mode keeps the in-memory result */
  }
}

let inflight: Promise<string | null> | null = null;

function loadLivePatch(): Promise<string | null> {
  inflight ??= readLiveGamePatch()
    .then((result) => {
      const patch = result?.patch;
      if (!patch || !isPatchName(patch)) return null;
      writeStamp(patch);
      return patch;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Last known public game patch. Rechecks at most every six hours. */
export function useLivePatch(): string {
  const [patch, setPatch] = useState("");

  useEffect(() => {
    const cached = readStamp();
    if (cached) setPatch(cached.patch);
    const stale = !cached || Date.now() - cached.at > FRESH_MS;
    if (!stale) return;
    let cancel = false;
    void loadLivePatch().then((next) => {
      if (!cancel && next) setPatch(next);
    });
    return () => {
      cancel = true;
    };
  }, []);

  return patch;
}
