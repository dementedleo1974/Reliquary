import { useEffect, useMemo, useState } from "react";
import { GEAR_LADDER } from "@/lib/gear-ladder";
import { JOB_ACTIONS, ROLE_ACTIONS, type JobAction } from "@/lib/job-actions";
import { JOBS } from "@/lib/relics";
import { cn } from "@/lib/utils";

const TIME_KEY = "reliquary-time-v1";
const MAX_RUNS = 400;
const MAX_MS = 24 * 60 * 60 * 1000;

const LOG_JOBS = [
  ...JOBS.map((job) => ({ id: job.id, name: job.name, abbrev: job.abbrev })),
  { id: "bst", name: "Beastmaster", abbrev: "BST" },
];

interface Run {
  job: string;
  start: number;
  end: number;
}

function knownJob(id: string) {
  return LOG_JOBS.some((job) => job.id === id);
}

function readRuns(): Run[] {
  try {
    const raw = localStorage.getItem(TIME_KEY);
    if (!raw || raw.length > 80_000) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((row): row is Run => {
        if (typeof row !== "object" || row === null) return false;
        const run = row as Run;
        return (
          knownJob(run.job) &&
          Number.isFinite(run.start) &&
          Number.isFinite(run.end) &&
          run.end > run.start &&
          run.end - run.start <= MAX_MS
        );
      })
      .slice(0, MAX_RUNS);
  } catch {
    return [];
  }
}

function writeRuns(runs: Run[]) {
  try {
    localStorage.setItem(TIME_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  } catch {
    /* the list still stands for this visit */
  }
}

function formatDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function TimeView() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [active, setActive] = useState<{ job: string; start: number } | null>(null);
  const [now, setNow] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRuns(readRuns());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [active]);

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const run of runs) map.set(run.job, (map.get(run.job) ?? 0) + (run.end - run.start));
    return map;
  }, [runs]);

  function start(job: string) {
    if (active) return;
    const startAt = Date.now();
    setActive({ job, start: startAt });
    setNow(startAt);
  }

  function stop() {
    if (!active) return;
    const end = Date.now();
    if (end - active.start > 1000 && end - active.start <= MAX_MS) {
      const next = [{ job: active.job, start: active.start, end }, ...runs].slice(0, MAX_RUNS);
      setRuns(next);
      writeRuns(next);
    }
    setActive(null);
  }

  return (
    <section className="mt-6 min-w-0">
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-3xl text-fg">Time</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          A run is recorded only while this timer is going. Nothing here is a published clear time.
          One timer can run, and a run longer than a day is discarded.
        </p>
      </div>
      <ul className="mt-4 space-y-2">
        {LOG_JOBS.map((job) => {
          const running = active?.job === job.id;
          const total = totals.get(job.id) ?? 0;
          return (
            <li key={job.id} className="flex items-center gap-3 rounded-lg bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <span className="w-12 text-xs text-accent">{job.abbrev}</span>
              <span className="min-w-0 flex-1 text-sm text-fg">{job.name}</span>
              <span className="tabular text-sm text-muted">
                {running ? formatDuration(now - active.start) : ready && total > 0 ? formatDuration(total) : "No run"}
              </span>
              {running ? (
                <button type="button" onClick={stop} className="h-8 rounded-full bg-fg px-3 text-xs text-accent-fg">
                  Stop
                </button>
              ) : (
                <button
                  type="button"
                  disabled={active !== null}
                  onClick={() => start(job.id)}
                  className="h-8 rounded-full bg-surface-2 px-3 text-xs text-fg disabled:text-subtle"
                >
                  Start
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function GearView() {
  return (
    <section className="mt-6 min-w-0">
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-3xl text-fg">Gear</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          These are the catch-up sets at the end of each expansion. They are the same slots for every
          combat job in that role's shop. This is not a melded best-in-slot list, and it does not replace
          the relic weapon.
        </p>
      </div>
      <ul className="mt-4 space-y-2">
        {GEAR_LADDER.map((step) => (
          <li key={`${step.expansion}-${step.itemLevel}`} className="rounded-lg bg-surface p-4 shadow-[var(--shadow-border)]">
            <p className="text-sm text-fg">
              {step.expansion}
              <span className="text-muted"> · level {step.level} · item level {step.itemLevel}</span>
            </p>
            <p className="mt-1 text-sm text-accent">{step.set}</p>
            <p className="mt-1 text-sm text-muted">{step.source}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function chains(actions: JobAction[]) {
  const names = new Set(actions.map((action) => action.name));
  const children = new Map<string, string[]>();
  for (const action of actions) {
    if (!action.after || !names.has(action.after)) continue;
    const list = children.get(action.after) ?? [];
    list.push(action.name);
    children.set(action.after, list);
  }
  const pointed = new Set(actions.filter((action) => action.after && names.has(action.after)).map((action) => action.name));
  const roots = [...children.keys()].filter((name) => !pointed.has(name));
  return roots.map((root) => {
    const line = [root];
    let cursor = root;
    const seen = new Set([root]);
    while (children.get(cursor)?.length === 1) {
      const next = children.get(cursor)![0]!;
      if (seen.has(next)) break;
      line.push(next);
      seen.add(next);
      cursor = next;
    }
    return line;
  }).filter((line) => line.length > 1);
}

export function SkillsView() {
  const [job, setJob] = useState(LOG_JOBS[0]!.id);
  const actions = JOB_ACTIONS[job] ?? [];
  const lines = useMemo(() => chains(actions), [actions]);
  const role = JOBS.find((row) => row.id === job)?.role;
  const shared = ROLE_ACTIONS.filter((action) => role !== undefined && action.roles.includes(role)).sort(
    (a, b) => a.level - b.level || a.name.localeCompare(b.name),
  );

  return (
    <section className="mt-6 min-w-0">
      <div className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
        <h2 className="font-display text-3xl text-fg">Skills</h2>
        <p className="mt-2 max-w-prose text-sm text-muted">
          The list is the order the game files teach the actions. A chain is the combo parent stored on
          the action. Role actions are not included. This is not a raid opener.
        </p>
        <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
          {LOG_JOBS.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setJob(row.id)}
              className={cn(
                "h-8 shrink-0 rounded-full px-3 text-xs",
                job === row.id ? "bg-fg text-accent-fg" : "bg-surface-2 text-muted",
              )}
            >
              {row.abbrev}
            </button>
          ))}
        </div>
      </div>
      {lines.length > 0 && (
        <ul className="mt-4 space-y-2">
          {lines.map((line) => (
            <li key={line.join(">") } className="rounded-lg bg-surface px-4 py-3 text-sm text-fg shadow-[var(--shadow-border)]">
              {line.join(" → ")}
            </li>
          ))}
        </ul>
      )}
      <ul className="mt-4 divide-y divide-border rounded-lg bg-surface px-4 shadow-[var(--shadow-border)]">
        {actions.map((action) => (
          <li key={`${action.level}-${action.name}`} className="flex gap-3 py-2 text-sm">
            <span className="w-10 tabular text-accent">{action.level}</span>
            <span className="text-fg">{action.name}</span>
          </li>
        ))}
      </ul>
      {shared.length > 0 && (
        <>
          <h3 className="mt-6 font-display text-2xl text-fg">Role actions</h3>
          <ul className="mt-2 divide-y divide-border rounded-lg bg-surface px-4 shadow-[var(--shadow-border)]">
            {shared.map((action) => (
              <li key={action.name} className="flex gap-3 py-2 text-sm">
                <span className="w-10 tabular text-accent">{action.level}</span>
                <span className="text-fg">{action.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
