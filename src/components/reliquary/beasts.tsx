import { useEffect, useMemo, useState } from "react";
import { BEAST_STEPS, BEASTS, type Beast } from "@/lib/beasts";
import { cn } from "@/lib/utils";

const KEY = "reliquary-beasts-v1";

function readCaught(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > 400) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter((n): n is number => Number.isInteger(n) && n >= 1 && n <= 50).slice(0, 50);
  } catch {
    return [];
  }
}

function writeCaught(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* the list still stands for this visit */
  }
}

export function BeastView() {
  const [caught, setCaught] = useState<number[]>([]);
  const [leftOnly, setLeftOnly] = useState(false);
  const [kin, setKin] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCaught(readCaught());
    setReady(true);
  }, []);

  const have = useMemo(() => new Set(caught), [caught]);
  const families = useMemo(() => ["all", ...new Set(BEASTS.map((b) => b.kin))], []);

  const visible = useMemo(
    () => BEASTS.filter((b) => (kin === "all" || b.kin === kin) && (!leftOnly || !have.has(b.n))),
    [kin, leftOnly, have],
  );

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Beast[]>();
    for (const beast of visible) {
      if (!map.has(beast.place)) {
        map.set(beast.place, []);
        order.push(beast.place);
      }
      map.get(beast.place)!.push(beast);
    }
    return order.map((place) => ({
      place,
      beasts: map.get(place)!.slice().sort((a, b) => a.level - b.level || a.n - b.n),
    }));
  }, [visible]);

  function toggle(n: number) {
    const next = have.has(n) ? caught.filter((id) => id !== n) : [...caught, n].sort((a, b) => a - b);
    setCaught(next);
    writeCaught(next);
  }

  return (
    <section className="mt-6 min-w-0">
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-3xl text-fg">Beastmaster</h2>
        <p className="mt-1 text-sm text-muted">
          {ready ? caught.length : 0}/50 caught. Limited job, level cap 50. Patch 7.56.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted">
          {BEAST_STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="mt-4 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setLeftOnly((v) => !v)}
          className={cn(
            "h-8 rounded-full px-3 text-xs",
            leftOnly ? "bg-fg text-accent-fg" : "bg-surface text-muted",
          )}
        >
          Still to catch
        </button>
        {families.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setKin(name)}
            className={cn(
              "h-8 rounded-full px-3 text-xs",
              kin === name ? "bg-fg text-accent-fg" : "bg-surface text-muted",
            )}
          >
            {name === "all" ? "All kin" : name}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {groups.map((group) => {
          const stay = group.beasts[group.beasts.length - 1]!;
          return (
            <section key={group.place}>
              <h3 className="font-display text-2xl text-fg">{group.place}</h3>
              <p className="mt-1 text-sm text-muted">
                Catch in this order while you are here. Do not leave without {stay.name}.
              </p>
              <ul className="mt-3 space-y-2">
                {group.beasts.map((beast) => {
                  const on = have.has(beast.n);
                  return (
                    <li key={beast.n} className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(beast.n)}
                          className={cn(
                            "mt-0.5 size-5 shrink-0 rounded-sm border border-border",
                            on && "bg-accent",
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-fg">
                            <span className="tabular text-accent">{String(beast.n).padStart(2, "0")}</span>{" "}
                            {beast.name}
                            <span className="text-muted"> · {beast.kin} · level {beast.level}</span>
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {beast.mob} · {beast.at}
                          </p>
                          <p className="mt-1 text-sm text-fg">{beast.how}</p>
                          <p className="mt-1 text-xs text-subtle">{beast.skills.join(" · ")}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {groups.length === 0 && <p className="text-sm text-muted">Nothing left for this filter.</p>}
      </div>
    </section>
  );
}
