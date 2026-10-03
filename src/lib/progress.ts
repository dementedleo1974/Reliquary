import { create } from "zustand";
import { persist } from "zustand/middleware";
import { JOBS, jobsForLine, RELIC_LINES } from "@/lib/relics";
import type { JobId, LineId, RelicItem, RelicLine } from "@/lib/relics";

export type WeaponKey = `${LineId}:${JobId}`;

export interface WeaponProgress {
  completed: string[];
  counts: Record<string, number>;
}

export interface ProgressSlice {
  shared: Record<string, number>;
  weapons: Record<string, WeaponProgress>;
}

interface ProgressState extends ProgressSlice {
  hydrated: boolean;
  selectedLine: LineId;
  selectedJob: JobId;
  selectLine: (id: LineId) => void;
  selectJob: (id: JobId) => void;
  toggleStage: (line: LineId, job: JobId, stageId: string, stageIds: string[]) => void;
  setCount: (line: LineId, job: JobId, item: RelicItem, value: number) => void;
  resetWeapon: (line: LineId, job: JobId) => void;
  resetAll: () => void;
  setHydrated: () => void;
}

function emptyWeapon(): WeaponProgress {
  return { completed: [], counts: {} };
}

function keyOf(line: LineId, job: JobId): WeaponKey {
  return `${line}:${job}`;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      selectedLine: "phantom",
      selectedJob: "pld",
      shared: {},
      weapons: {},
      setHydrated: () => set({ hydrated: true }),
      selectLine: (id) => {
        const jobs = jobsForLine(id);
        const current = get().selectedJob;
        const nextJob = jobs.some((j) => j.id === current) ? current : jobs[0]!.id;
        set({ selectedLine: id, selectedJob: nextJob });
      },
      selectJob: (id) => set({ selectedJob: id }),
      toggleStage: (line, job, stageId, stageIds) => {
        const key = keyOf(line, job);
        const current = get().weapons[key] ?? emptyWeapon();
        const has = current.completed.includes(stageId);
        let completed: string[];
        if (has) {
          const idx = stageIds.indexOf(stageId);
          completed = current.completed.filter((id) => {
            const i = stageIds.indexOf(id);
            return i >= 0 && i < idx;
          });
        } else {
          const idx = stageIds.indexOf(stageId);
          completed = stageIds.slice(0, idx + 1);
        }
        set({
          weapons: {
            ...get().weapons,
            [key]: { ...current, completed },
          },
        });
      },
      setCount: (line, job, item, value) => {
        const clamped = Math.max(0, Math.min(item.qty, value));
        if (item.shared) {
          set({ shared: { ...get().shared, [item.id]: clamped } });
          return;
        }
        const key = keyOf(line, job);
        const current = get().weapons[key] ?? emptyWeapon();
        set({
          weapons: {
            ...get().weapons,
            [key]: { ...current, counts: { ...current.counts, [item.id]: clamped } },
          },
        });
      },
      resetWeapon: (line, job) => {
        const weapons = { ...get().weapons };
        delete weapons[keyOf(line, job)];
        set({ weapons });
      },
      resetAll: () => set({ shared: {}, weapons: {} }),
    }),
    {
      name: "reliquary-progress-v1",
      skipHydration: true,
      partialize: (s) => ({
        selectedLine: s.selectedLine,
        selectedJob: s.selectedJob,
        shared: s.shared,
        weapons: s.weapons,
      }),
      merge: (persisted, current) => ({ ...current, ...sanitizeProgressState(persisted) }),
    },
  ),
);

const LINE_IDS = new Set(RELIC_LINES.map((line) => line.id));
const JOB_IDS = new Set(JOBS.map((job) => job.id));
const MAX_SAVE_CHARS = 200_000;

const stagesByLine = new Map<string, Set<string>>();
const itemsByLine = new Map<string, Map<string, number>>();
const itemQty = new Map<string, number>();

for (const line of RELIC_LINES) {
  const stages = new Set<string>();
  const items = new Map<string, number>();
  for (const stage of line.stages) {
    stages.add(stage.id);
    for (const item of stage.items) {
      items.set(item.id, item.qty);
      itemQty.set(item.id, Math.max(itemQty.get(item.id) ?? 0, item.qty));
    }
  }
  stagesByLine.set(line.id, stages);
  itemsByLine.set(line.id, items);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeKey(key: string): boolean {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype" && /^[a-z0-9:_-]{1,48}$/i.test(key);
}

function clampCount(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(max, Math.floor(value)));
}

export interface SaveData {
  selectedLine: LineId;
  selectedJob: JobId;
  shared: Record<string, number>;
  weapons: Record<string, WeaponProgress>;
}

/** Drops anything that is not a known line, job, stage, or item. */
export function sanitizeProgressState(input: unknown): SaveData {
  const data = isRecord(input) ? input : {};
  const selectedLine = LINE_IDS.has(data.selectedLine as LineId)
    ? (data.selectedLine as LineId)
    : "zodiac";
  const jobs = jobsForLine(selectedLine);
  const selectedJob = jobs.some((job) => job.id === data.selectedJob) ? (data.selectedJob as JobId) : jobs[0]!.id;

  const shared: Record<string, number> = {};
  if (isRecord(data.shared)) {
    for (const [key, value] of Object.entries(data.shared)) {
      const max = itemQty.get(key);
      if (!safeKey(key) || max == null) continue;
      const count = clampCount(value, max);
      if (count != null && count > 0) shared[key] = count;
    }
  }

  const weapons: Record<string, WeaponProgress> = {};
  if (isRecord(data.weapons)) {
    for (const [key, value] of Object.entries(data.weapons)) {
      if (!safeKey(key) || !isRecord(value)) continue;
      const [lineId, jobId] = key.split(":");
      if (!LINE_IDS.has(lineId as LineId) || !JOB_IDS.has(jobId as JobId)) continue;
      if (!jobsForLine(lineId as LineId).some((job) => job.id === jobId)) continue;
      const stageSet = stagesByLine.get(lineId);
      const itemMap = itemsByLine.get(lineId);
      if (!stageSet || !itemMap) continue;
      const completed = Array.isArray(value.completed)
        ? value.completed.filter((id): id is string => typeof id === "string" && stageSet.has(id)).slice(0, stageSet.size)
        : [];
      const counts: Record<string, number> = {};
      if (isRecord(value.counts)) {
        for (const [countKey, countValue] of Object.entries(value.counts)) {
          const max = itemMap.get(countKey);
          if (!safeKey(countKey) || max == null) continue;
          const count = clampCount(countValue, max);
          if (count != null && count > 0) counts[countKey] = count;
        }
      }
      if (completed.length || Object.keys(counts).length) weapons[key] = { completed, counts };
    }
  }

  return { selectedLine, selectedJob, shared, weapons };
}

export function readReliquarySave(raw: string): SaveData {
  if (raw.length > MAX_SAVE_CHARS) throw new Error("That file is too large.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!isRecord(data) || data.app !== "reliquary" || data.version !== 1) {
    throw new Error("That file is not a Reliquary save.");
  }
  return sanitizeProgressState(data);
}

export function downloadProgressFile() {
  const state = useProgress.getState();
  const body = JSON.stringify(
    {
      version: 1,
      app: "reliquary",
      selectedLine: state.selectedLine,
      selectedJob: state.selectedJob,
      shared: state.shared,
      weapons: state.weapons,
    },
    null,
    2,
  );
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reliquary.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function restoreProgressFile(raw: string) {
  useProgress.setState(readReliquarySave(raw));
}

export function getWeapon(slice: ProgressSlice, line: LineId, job: JobId): WeaponProgress {
  return slice.weapons[keyOf(line, job)] ?? emptyWeapon();
}

export function itemCount(
  slice: ProgressSlice,
  line: LineId,
  job: JobId,
  item: RelicItem,
): number {
  if (item.shared) return slice.shared[item.id] ?? 0;
  return getWeapon(slice, line, job).counts[item.id] ?? 0;
}

export function lineCompletion(slice: ProgressSlice, line: RelicLine): { done: number; total: number } {
  const jobs = jobsForLine(line.id);
  const last = line.stages.at(-1)?.id;
  const done = last
    ? jobs.filter((job) => getWeapon(slice, line.id, job.id).completed.includes(last)).length
    : 0;
  return { done, total: jobs.length };
}

export interface ShopRow {
  item: RelicItem;
  have: number;
  remaining: number;
  line: RelicLine;
  jobLabel: string;
}

export function shoppingList(slice: ProgressSlice, line: RelicLine): ShopRow[] {
  const jobs = jobsForLine(line.id);
  const rows: ShopRow[] = [];
  const seenShared = new Set<string>();

  for (const job of jobs) {
    const weapon = getWeapon(slice, line.id, job.id);
    const nextStage = line.stages.find((s) => !weapon.completed.includes(s.id));
    if (!nextStage) continue;
    for (const item of nextStage.items) {
      const have = itemCount(slice, line.id, job.id, item);
      const remaining = Math.max(0, item.qty - have);
      if (remaining <= 0) continue;
      if (item.shared) {
        if (seenShared.has(item.id)) continue;
        seenShared.add(item.id);
        rows.push({ item, have, remaining, line, jobLabel: "Account" });
      } else {
        rows.push({ item, have, remaining, line, jobLabel: job.abbrev });
      }
    }
  }
  return rows;
}
