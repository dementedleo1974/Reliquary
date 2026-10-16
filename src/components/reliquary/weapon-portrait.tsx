import type { JobId, LineId, WeaponKind } from "@/lib/relics";
import { publicPath } from "@/lib/public-path";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { LINE_GLOW } from "./line-glow";

interface Props {
  kind: WeaponKind;
  lineId: LineId;
  jobId: JobId;
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
  jobId,
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
  const dim = size === "sm" ? "size-16" : size === "md" ? "size-28" : "size-44 max-w-full sm:size-64 md:size-72";
  const live = size !== "sm";
  const icon = publicPath(`/icons/relics/${lineId}/${jobId}/${stageIndex}.png`);
  const painted = publicPath(`/weapons/${lineId}/${kind}.jpg`);
  const [src, setSrc] = useState(icon);
  const [gameIcon, setGameIcon] = useState(true);
  useEffect(() => {
    setSrc(icon);
    setGameIcon(true);
  }, [icon]);

  return (
    <div
      className={cn("weapon-stage relative mx-auto aspect-square overflow-hidden rounded-lg", dim, gameIcon && "weapon-game")}
      style={{
        ["--glow" as string]: glow,
        ["--awake" as string]: String(awake),
        ["--tier" as string]: String(tier),
      }}
    >
      <div className="absolute inset-0" style={{ transform: gameIcon ? undefined : `scale(${0.56 + tier * 0.44})` }}>
        <img
          src={src}
          alt={live ? `${name}, step ${stageIndex + 1} of ${stageCount}` : ""}
          className={gameIcon ? "weapon-art weapon-game-icon" : "weapon-plate weapon-art"}
          draggable={false}
          onError={() => {
            if (!gameIcon) return;
            setGameIcon(false);
            setSrc(painted);
          }}
        />
        {gameIcon && live && <img src={src} alt="" className="weapon-bloom" draggable={false} />}
      </div>
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
  jobId,
  stageCount,
  current,
  doneCount,
  names,
  onSelect,
}: {
  kind: WeaponKind;
  lineId: LineId;
  jobId: JobId;
  stageCount: number;
  current: number;
  doneCount: number;
  names: string[];
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {Array.from({ length: stageCount }, (_, i) => (
        <button
          key={names[i] ?? i}
          type="button"
          onClick={() => onSelect(i)}
          className={cn(
            "flex w-24 shrink-0 snap-start flex-col items-center gap-1 rounded-md p-2 transition-[box-shadow,background-color] duration-150",
            i === current ? "bg-surface-2 shadow-[var(--shadow-border-hover)]" : "hover:bg-surface-2/60",
          )}
        >
          <WeaponPortrait
            kind={kind}
            lineId={lineId}
            jobId={jobId}
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
