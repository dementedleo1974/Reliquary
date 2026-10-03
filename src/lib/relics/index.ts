export * from "./types";
export * from "./jobs";
export * from "./lines";

import type { Job, RelicLine, RelicStage } from "./types";

export function weaponTitle(line: RelicLine, job: Job, stage?: RelicStage): string {
  const names = line.weaponNames[job.id];
  if (!names) return `${line.short} ${job.name}`;
  if (!stage) return names.final;
  const idx = line.stages.findIndex((s) => s.id === stage.id);
  if (idx === line.stages.length - 1) return names.final;
  if (idx <= 0) return names.base;
  return `${names.base} ${stage.name}`;
}

export function stageProgress(completed: string[], stages: RelicStage[]): number {
  if (stages.length === 0) return 0;
  return completed.filter((id) => stages.some((s) => s.id === id)).length / stages.length;
}

export const SOURCE_LABEL: Record<string, string> = {
  farm: "Farm",
  vendor: "Vendor",
  craft: "Craft",
  marketboard: "Market",
  tomestone: "Tomes",
  duty: "Duty",
  gil: "Gil vendor",
};
