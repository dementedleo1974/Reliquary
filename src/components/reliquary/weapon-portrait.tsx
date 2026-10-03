import type { LineId, WeaponKind } from "@/lib/relics";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { LINE_GLOW } from "./line-glow";

const MOTION: Record<WeaponKind, string> = {
  sword: "motion-swing",
  axe: "motion-swing",
  greatsword: "motion-heave",
  gunblade: "motion-recoil",
  fist: "motion-punch",
  polearm: "motion-bob",
  daggers: "motion-flick",
  katana: "motion-draw",
  scythe: "motion-swing",
  twinblades: "motion-spin",
  bow: "motion-draw",
  firearm: "motion-recoil",
  chakrams: "motion-spin",
  staff: "motion-bob",
  grimoire: "motion-flutter",
  rapier: "motion-flick",
  brush: "motion-draw",
  cane: "motion-bob",
  codex: "motion-flutter",
  globe: "motion-spin",
  nouliths: "motion-hover",
};

interface Props {
  kind: WeaponKind;
  lineId: LineId;
  stageIndex: number;
  stageCount: number;
  name: string;
  extra?: string;
  completed?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WeaponPortrait({
  kind,
  lineId,
  stageIndex,
  stageCount,
  name,
  extra,
  completed,
  size = "lg",
}: Props) {
  const tier = stageCount <= 1 ? 1 : stageIndex / (stageCount - 1);
  const awake = 0.22 + tier * 0.78;
  const glow = LINE_GLOW[lineId];
  const dim = size === "sm" ? "size-16" : size === "md" ? "size-28" : "size-64 max-w-full sm:size-72";
  const live = size !== "sm";
  const [src, setSrc] = useState(`/weapons/${lineId}/${kind}.jpg`);
  useEffect(() => {
    setSrc(`/weapons/${lineId}/${kind}.jpg`);
  }, [lineId, kind]);

  return (
    <div
      className={cn("weapon-stage relative mx-auto aspect-square overflow-hidden rounded-lg", dim, MOTION[kind], live && "weapon-stage-live")}
      data-still={live ? undefined : "true"}
      style={{
        ["--glow" as string]: glow,
        ["--awake" as string]: String(awake),
        ["--tier" as string]: String(tier),
      }}
    >
      <div className="absolute inset-0" style={{ transform: `scale(${0.56 + tier * 0.44})` }}>
        <img
          src={src}
          alt={live ? `${name}, step ${stageIndex + 1} of ${stageCount}` : ""}
          className="weapon-plate"
          draggable={false}
          onError={() => setSrc(`/weapons/${kind}.jpg`)}
        />
      </div>
      {live && tier >= 0.6 && <span className="weapon-sheen" aria-hidden />}
      {live && tier >= 0.3 && (
        <span className="weapon-motes" aria-hidden>
          <i />
          <i />
          {tier >= 0.6 && <i />}
          {tier >= 0.85 && (
            <>
              <i />
              <i />
            </>
          )}
        </span>
      )}
      {completed && size !== "sm" && (
        <span className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-fg px-2 py-0.5 text-xs font-medium tracking-wide text-accent-fg">
          Complete
        </span>
      )}
      {completed && size === "sm" && (
        <span className="absolute top-1 right-1 z-10 size-2 rounded-full bg-accent" aria-hidden />
      )}
      {size === "lg" && extra && stageIndex === 0 && (
        <span className="sr-only">
          {name} and {extra}
        </span>
      )}
    </div>
  );
}

export function StageStrip({
  kind,
  lineId,
  stageCount,
  current,
  doneCount,
  names,
  onSelect,
}: {
  kind: WeaponKind;
  lineId: LineId;
  stageCount: number;
  current: number;
  doneCount: number;
  names: string[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex w-full max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: stageCount }, (_, i) => (
        <button
          key={names[i] ?? i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "flex w-20 shrink-0 flex-col items-center gap-1 rounded-md p-2 transition-[box-shadow,background-color] duration-150",
            i === current ? "bg-surface-2 shadow-[var(--shadow-border-hover)]" : "hover:bg-surface-2/60",
          )}
        >
          <WeaponPortrait
            kind={kind}
            lineId={lineId}
            stageIndex={i}
            stageCount={stageCount}
            name={names[i] ?? ""}
            completed={i < doneCount}
            size="sm"
          />
          <span className="text-xs tabular text-accent">{i + 1}</span>
          <span title={names[i]} className="max-w-full truncate text-xs text-muted">
            {names[i]}
          </span>
        </button>
      ))}
    </div>
  );
}
