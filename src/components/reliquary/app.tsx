import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Coins,
  Download,
  Globe,
  ListTodo,
  MapPin,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShoppingBag,
  Squirrel,
  Smartphone,
  Timer,
} from "lucide-react";
import {
  decodeSaveCode,
  downloadProgressFile,
  encodeSaveCode,
  getWeapon,
  itemCount,
  lineCompletion,
  restoreProgressFile,
  saveBody,
  shoppingList,
  useProgress,
  type ProgressSlice,
} from "@/lib/progress";
import {
  JOBS,
  jobsForLine,
  RELIC_LINES,
  ROLE_LABEL,
  SOURCE_LABEL,
  weaponTitle,
  type ItemSource,
  type Job,
  type RelicItem,
  type RelicLine,
  type RelicStage,
} from "@/lib/relics";
import { cn } from "@/lib/utils";
import { BoardView, MarketProvider } from "@/lib/market-board";
import { useLivePatch } from "@/lib/use-live-patch";
import { Button } from "@/components/ui/button";
import { LINE_GLOW } from "./line-glow";
import { StageStrip, WeaponPortrait } from "./weapon-portrait";

const AtlasView = lazy(() => import("./atlas").then((mod) => ({ default: mod.AtlasView })));
const BeastView = lazy(() => import("./beasts").then((mod) => ({ default: mod.BeastView })));
const TimeView = lazy(() => import("./records").then((mod) => ({ default: mod.TimeView })));
const GearView = lazy(() => import("./records").then((mod) => ({ default: mod.GearView })));
const SkillsView = lazy(() => import("./records").then((mod) => ({ default: mod.SkillsView })));
const JobSheet = lazy(() => import("./records").then((mod) => ({ default: mod.JobSheet })));

type AppView = "tracker" | "list" | "board" | "atlas" | "beasts" | "time" | "gear" | "skills";

const SOURCE_FILTERS: Array<ItemSource | "all"> = [
  "all",
  "farm",
  "tomestone",
  "craft",
  "marketboard",
  "vendor",
  "duty",
  "gil",
];

export function ReliquaryApp() {
  const selectedLine = useProgress((s) => s.selectedLine);
  const selectedJob = useProgress((s) => s.selectedJob);
  const selectLine = useProgress((s) => s.selectLine);
  const selectJob = useProgress((s) => s.selectJob);
  const setHydrated = useProgress((s) => s.setHydrated);
  const weapons = useProgress((s) => s.weapons);
  const shared = useProgress((s) => s.shared);
  const [view, setView] = useState<AppView>("tracker");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const result = useProgress.persist.rehydrate();
    void Promise.resolve(result).then(() => setHydrated());
  }, [setHydrated]);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js");
  }, []);

  const slice: ProgressSlice = { weapons, shared };
  const line = RELIC_LINES.find((l) => l.id === selectedLine) ?? RELIC_LINES[0]!;
  const jobs = jobsForLine(line.id);
  const job = jobs.find((j) => j.id === selectedJob) ?? jobs[0]!;
  const progress = getWeapon(slice, line.id, job.id);

  const filteredJobs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return JOBS;
    return JOBS.filter(
      (j) =>
        j.name.toLowerCase().includes(q) ||
        j.abbrev.toLowerCase().includes(q) ||
        j.role.includes(q),
    );
  }, [query]);

  const install = useAndroidInstall();
  const livePatch = useLivePatch();

  return (
    <MarketProvider active={view === "board"}>
    <div className="min-h-dvh overflow-x-hidden bg-bg text-fg">
      <Header view={view} onView={setView} install={install} livePatch={livePatch} />
      <main className={cn("mx-auto min-w-0 max-w-6xl px-4 pt-5 sm:px-6", install.showBar ? "pb-28" : "pb-12")}>
        {view !== "atlas" && view !== "board" && view !== "beasts" && view !== "time" && view !== "gear" && view !== "skills" && (
          <ExpansionNav
            slice={slice}
            selected={line.id}
            onSelect={(id) => {
              selectLine(id);
              setView("tracker");
            }}
          />
        )}
        {view === "atlas" ? (
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening the world.</p>}>
            <AtlasView livePatch={livePatch} />
          </Suspense>
        ) : view === "beasts" ? (
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening the bestiary.</p>}>
            <BeastView />
          </Suspense>
        ) : view === "time" ? (
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening the time log.</p>}>
            <TimeView />
          </Suspense>
        ) : view === "gear" ? (
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening gear.</p>}>
            <GearView />
          </Suspense>
        ) : view === "skills" ? (
          <Suspense fallback={<p className="mt-8 text-sm text-muted">Opening skills.</p>}>
            <SkillsView />
          </Suspense>
        ) : view === "board" ? (
          <BoardView />
        ) : view === "list" ? (
          <ShoppingView
            line={line}
            slice={slice}
            onOpenJob={(id) => {
              selectJob(id);
              setView("tracker");
            }}
          />
        ) : (
          <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <JobRail
              line={line}
              slice={slice}
              jobs={filteredJobs}
              selected={job.id}
              query={query}
              onQuery={setQuery}
              onSelect={(id) => {
                const next = JOBS.find((j) => j.id === id);
                if (next && !jobs.some((j) => j.id === id)) selectLine(next.since);
                selectJob(id);
              }}
            />
            <WeaponPanel line={line} job={job} completed={progress.completed} slice={slice} />
          </div>
        )}
      </main>
      {install.showBar && <AndroidInstallBar install={install} />}
    </div>
    </MarketProvider>
  );
}

function UpdateButton({ livePatch }: { livePatch: string }) {
  const boot = useRef<string | null>(null);
  const applying = useRef(false);
  const [checking, setChecking] = useState(false);
  const [hint, setHint] = useState("");

  function applyUpdate() {
    if (applying.current) return;
    applying.current = true;
    setHint("Updating");
    window.setTimeout(() => window.location.reload(), 300);
  }

  const checkRef = useRef<(apply: boolean) => Promise<"same" | "boot" | "fresh">>(async () => "same");

  async function check(apply: boolean) {
    try {
      if (import.meta.env.PROD && "serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        await registration?.update();
        registration?.waiting?.postMessage("skip-waiting");
      }
      const response = await fetch("/version.json", { cache: "no-store" });
      if (!response.ok) return "same" as const;
      const data = (await response.json()) as { version?: unknown };
      const version = data.version;
      if (typeof version !== "string" || !/^[a-z0-9]{4,32}$/i.test(version)) return "same" as const;
      if (boot.current === null) {
        boot.current = version;
        return "boot" as const;
      }
      if (version !== boot.current) {
        if (apply) applyUpdate();
        return "fresh" as const;
      }
      return "same" as const;
    } catch {
      return "same" as const;
    }
  }

  checkRef.current = check;

  useEffect(() => {
    const run = () => void checkRef.current(true);
    void run();
    const timer = window.setInterval(run, 15_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };
    const onFocus = () => run();
    let hadController = false;
    const onController = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      applyUpdate();
    };
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener("controllerchange", onController);
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      if (import.meta.env.PROD && "serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("controllerchange", onController);
      }
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      title={
        hint ||
        (livePatch
          ? `Checks this site on its own. Live game files are ${livePatch}. Progress stays on this device.`
          : "Checks this site on its own. Progress stays on this device.")
      }
      onClick={() => {
        setChecking(true);
        void check(true)
          .then((result) => {
            if (result !== "same") return;
            setHint("Current");
            window.setTimeout(() => setHint(""), 2000);
          })
          .catch(() => setHint("Couldn't check"))
          .finally(() => setChecking(false));
      }}
    >
      <RefreshCw className={cn("size-4", checking && "animate-spin")} />
      <span className="hidden sm:inline">{hint || "Auto"}</span>
    </Button>
  );
}

function Header({
  view,
  onView,
  install,
  livePatch,
}: {
  view: AppView;
  onView: (v: AppView) => void;
  install: AndroidInstall;
  livePatch: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.65rem] uppercase tracking-[0.18em] text-subtle">Final Fantasy XIV</p>
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl leading-none text-fg sm:text-3xl">Reliquary</h1>
            <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-accent">
              Beta
            </span>
          </div>
          <a
            href="https://github.com/dementedleo1974/Reliquary"
            target="_blank"
            rel="noreferrer"
            className="mt-1 block max-w-full truncate text-xs text-subtle hover:text-accent"
          >
            github.com/dementedleo1974/Reliquary
          </a>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-surface p-0.5 shadow-[var(--shadow-border)]">
            <Button
              variant={view === "tracker" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onView("tracker")}
            >
              <ListTodo className="size-4" />
              <span className="hidden sm:inline">Tracker</span>
            </Button>
            <Button
              variant={view === "list" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onView("list")}
            >
              <ShoppingBag className="size-4" />
              <span className="hidden sm:inline">Materials</span>
            </Button>
            <Button
              variant={view === "board" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onView("board")}
            >
              <Coins className="size-4" />
              <span className="hidden sm:inline">Market</span>
            </Button>
            <Button
              variant={view === "atlas" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onView("atlas")}
            >
              <Globe className="size-4" />
              <span className="hidden md:inline">The World</span>
            </Button>
            <Button
              variant={view === "beasts" ? "primary" : "ghost"}
              size="sm"
              onClick={() => onView("beasts")}
            >
              <Squirrel className="size-4" />
              <span className="hidden md:inline">Beasts</span>
            </Button>
            <Button variant={view === "time" ? "primary" : "ghost"} size="sm" onClick={() => onView("time")}>
              <Timer className="size-4" />
              <span className="hidden lg:inline">Time</span>
            </Button>
            <Button variant={view === "gear" ? "primary" : "ghost"} size="sm" onClick={() => onView("gear")}>
              <Shield className="size-4" />
              <span className="hidden lg:inline">Gear</span>
            </Button>
            <Button variant={view === "skills" ? "primary" : "ghost"} size="sm" onClick={() => onView("skills")}>
              <ListTodo className="size-4" />
              <span className="hidden lg:inline">Skills</span>
            </Button>
          </div>
          <UpdateButton livePatch={livePatch} />
          <DownloadMenu install={install} />
        </div>
      </div>
    </header>
  );
}

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface AndroidInstall {
  showBar: boolean;
  installed: boolean;
  android: boolean;
  ready: boolean;
  note: string;
  install: () => Promise<void>;
  dismiss: () => void;
}

function useAndroidInstall(): AndroidInstall {
  const promptRef = useRef<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [android, setAndroid] = useState(false);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    const ua = navigator.userAgent;
    setAndroid(/Android/i.test(ua));
    setDismissed(localStorage.getItem("reliquary-android-dismissed") === "1");
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(standalone);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      promptRef.current = event as InstallPrompt;
      setReady(true);
    };
    const onInstalled = () => {
      promptRef.current = null;
      setInstalled(true);
      setReady(false);
      setNote("Installed. Reliquary is in your app drawer.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (installed) {
      setNote("Reliquary is already on this device.");
      return;
    }
    const pending = promptRef.current;
    if (pending) {
      await pending.prompt();
      const choice = await pending.userChoice;
      promptRef.current = null;
      setReady(false);
      if (choice.outcome === "accepted") {
        setInstalled(true);
        setNote("Installed. Reliquary is in your app drawer.");
      } else {
        setNote("Install dismissed.");
      }
      return;
    }
    const ua = navigator.userAgent;
    const ios =
      /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios) {
      window.location.assign("/?install=1&platform=ios");
      return;
    }
    if (/Android/i.test(ua)) {
      setNote("In Chrome, open the menu and tap Install app. It is added with your other Android apps.");
      return;
    }
    setNote("Open the browser menu and choose Install app.");
  }

  return {
    showBar: android && !installed && !dismissed,
    installed,
    android,
    ready,
    note,
    install,
    dismiss: () => {
      localStorage.setItem("reliquary-android-dismissed", "1");
      setDismissed(true);
    },
  };
}

function AndroidInstallBar({ install }: { install: AndroidInstall }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <img src="/icons/icon-192.png" alt="" className="size-10 rounded-md shadow-[var(--shadow-border)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-fg">Install on Android</p>
          <p className="truncate text-xs text-muted">
            {install.note ||
              (install.ready
                ? "Opens full screen from the app drawer."
                : "Chrome menu, then Install app.")}
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => void install.install()}>
          Install
        </Button>
        <button type="button" className="text-xs text-subtle hover:text-fg" onClick={install.dismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function DownloadMenu({ install }: { install: AndroidInstall }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const progress = useProgress();

  function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 200_000 || !file.name.toLowerCase().endsWith(".json")) {
      setNote("Choose a Reliquary .json save under 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        restoreProgressFile(String(reader.result ?? ""));
        setNote("Progress imported.");
        setOpen(false);
      } catch (error) {
        setNote(error instanceof Error ? error.message : "Could not restore that file.");
      }
    };
    reader.readAsText(file);
  }

  async function copyCode() {
    try {
      const next = await encodeSaveCode(
        saveBody({
          selectedLine: progress.selectedLine,
          selectedJob: progress.selectedJob,
          shared: progress.shared,
          weapons: progress.weapons,
        }),
      );
      setCode(next);
      await navigator.clipboard.writeText(next);
      setNote("Save code copied. Paste it on the other device.");
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not copy the save code.");
    }
  }

  async function applyCode() {
    try {
      restoreProgressFile(await decodeSaveCode(code));
      setNote("Progress restored from the save code.");
      setOpen(false);
    } catch (error) {
      setNote(error instanceof Error ? error.message : "Could not read that save code.");
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Download className="size-4" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg bg-surface p-2 shadow-[var(--shadow-border)]">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            onClick={() => void copyCode()}
          >
            <ListTodo className="size-4 text-accent" />
            Copy save code
          </button>
          <label className="block px-3 py-2">
            <span className="text-xs text-subtle">Paste a save code</span>
            <textarea
              value={code}
              onChange={(event) => setCode(event.target.value)}
              rows={3}
              spellCheck={false}
              className="mt-1 w-full resize-none rounded-sm bg-bg px-2 py-1 text-xs text-fg"
            />
            <button type="button" className="mt-1 text-xs text-accent" onClick={() => void applyCode()}>
              Restore this code
            </button>
          </label>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            onClick={() => {
              downloadProgressFile();
              setNote("Exported reliquary.json");
            }}
          >
            <Download className="size-4 text-accent" />
            Export progress
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            onClick={() => fileRef.current?.click()}
          >
            <ListTodo className="size-4 text-accent" />
            Import progress
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            onClick={() => void install.install()}
          >
            <Smartphone className="size-4 text-accent" />
            {install.installed ? "Installed" : install.android ? "Install on Android" : "Install app"}
          </button>
          {(note || install.note) && <p className="px-3 py-2 text-xs text-muted">{note || install.note}</p>}
          <p className="px-3 pb-2 text-xs text-subtle">The code is the save. It is not an account.</p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              onFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}

function ExpansionNav({
  selected,
  onSelect,
  slice,
}: {
  selected: string;
  onSelect: (id: RelicLine["id"]) => void;
  slice: ProgressSlice;
}) {
  return (
    <nav className="flex max-w-full gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {RELIC_LINES.map((line) => {
        const { done, total } = lineCompletion(slice, line);
        const active = line.id === selected;
        return (
          <button
            key={line.id}
            type="button"
            onClick={() => onSelect(line.id)}
            className={cn(
              "relative h-28 w-44 shrink-0 overflow-hidden rounded-lg text-left shadow-[var(--shadow-border)] transition-[box-shadow,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              active ? "shadow-[var(--shadow-border-hover)]" : "hover:shadow-[var(--shadow-border-hover)]",
            )}
          >
            <img
              src={line.art}
              alt=""
              className="absolute inset-0 h-full w-full object-cover outline outline-1 -outline-offset-1 outline-white/10"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-bg via-bg/55 to-bg/10" />
            <span className="relative z-10 flex h-full flex-col justify-end p-3">
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
                {line.expansion}
              </span>
              <span className="font-display text-lg leading-tight text-fg">{line.short}</span>
              <span className="mt-1 text-xs tabular text-accent">
                {done}/{total} complete
              </span>
            </span>
            {active && (
              <span
                className="absolute inset-x-0 bottom-0 z-10 h-0.5"
                style={{ background: LINE_GLOW[line.id] }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

const START_NAME: Record<Job["since"], string> = {
  zodiac: "Zodiac",
  anima: "Anima",
  eureka: "Eureka",
  resistance: "Resistance",
  manderville: "Manderville",
  phantom: "Phantom",
};

function JobRail({
  line,
  jobs,
  selected,
  query,
  onQuery,
  onSelect,
  slice,
}: {
  line: RelicLine;
  jobs: Job[];
  selected: string;
  query: string;
  onQuery: (v: string) => void;
  onSelect: (id: Job["id"]) => void;
  slice: ProgressSlice;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        {ready ? (
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Find a job"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full rounded-md bg-surface pl-10 pr-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        ) : (
          <div className="h-10 w-full rounded-md bg-surface shadow-[var(--shadow-border)]" />
        )}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible">
        {jobs.map((job) => {
          const onLine = jobsForLine(line.id).some((j) => j.id === job.id);
          const done = onLine ? getWeapon(slice, line.id, job.id).completed.length : 0;
          const total = line.stages.length;
          const active = job.id === selected;
          return (
            <button
              key={job.id}
              type="button"
              onClick={() => onSelect(job.id)}
              className={cn(
                "flex min-w-40 items-center gap-3 rounded-md px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 lg:min-w-0 lg:w-full",
                active
                  ? "bg-surface text-fg shadow-[inset_2px_0_0_var(--color-accent)]"
                  : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-sm bg-bg text-xs font-medium tracking-wide text-accent">
                {job.abbrev}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{job.name}</span>
                <span className="block text-xs tabular text-subtle">
                  {onLine ? `${done}/${total} · ${ROLE_LABEL[job.role]}` : `Opens ${START_NAME[job.since]}`}
                </span>
              </span>
            </button>
          );
        })}
        {jobs.length === 0 && <p className="px-2 py-4 text-sm text-muted">No jobs match.</p>}
      </div>
    </aside>
  );
}

function stageItemForge(slice: ProgressSlice, line: RelicLine, job: Job, stage: RelicStage): number {
  const items = stage.items.filter((item) => !item.optional);
  if (items.length === 0) return 0;
  let need = 0;
  let have = 0;
  for (const item of items) {
    need += item.qty;
    have += Math.min(item.qty, itemCount(slice, line.id, job.id, item));
  }
  return need === 0 ? 0 : have / need;
}

function WeaponPanel({
  line,
  job,
  completed,
  slice,
}: {
  line: RelicLine;
  job: Job;
  completed: string[];
  slice: ProgressSlice;
}) {
  const toggleStage = useProgress((s) => s.toggleStage);
  const resetWeapon = useProgress((s) => s.resetWeapon);
  const stageIds = line.stages.map((s) => s.id);
  const currentIdx = Math.min(completed.length, line.stages.length - 1);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const idx = viewIdx ?? currentIdx;
  const stage = line.stages[idx] ?? line.stages[0]!;
  const names = line.weaponNames[job.id];
  const title = weaponTitle(line, job, stage);
  const start = line.jobStarts?.[job.id];
  const doneCount = completed.length;
  const stageDone = completed.includes(stage.id);
  const forged = idx < doneCount ? 1 : idx === doneCount ? stageItemForge(slice, line, job, stage) : 0;

  useEffect(() => {
    setViewIdx(null);
  }, [job.id, line.id]);

  return (
    <section className="min-w-0 overflow-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
            {line.name} · Item level {stage.ilvl}
          </p>
          <h2 className="mt-1 font-display text-3xl text-fg">{title}</h2>
          <p className="mt-1 text-sm text-muted">
            {job.name} · Level {line.level} · {line.patch}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => resetWeapon(line.id, job.id)}>
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
        <div>
          <WeaponPortrait
            kind={job.weapon}
            lineId={line.id}
            jobId={job.id}
            stageIndex={idx}
            stageCount={line.stages.length}
            name={title}
            extra={names?.extra}
            completed={stageDone}
          />
          <p className="mt-3 text-center text-sm text-fg">
            Step {idx + 1} of {line.stages.length}
            <span className="text-muted"> · {stage.name}</span>
          </p>
          <div className="mx-auto mt-2 h-1 w-full max-w-48 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full transition-[width] duration-300"
              style={{ width: `${Math.round(forged * 100)}%`, background: LINE_GLOW[line.id] }}
            />
          </div>
          <p className="mt-2 text-center text-xs text-subtle">
            {stageDone
              ? "Stage logged"
              : idx > doneCount
                ? "Preview of a later stage"
                : stage.items.length === 0
                  ? "No materials. Log the clears."
                  : `${Math.round(forged * 100)}% of materials gathered`}
          </p>
        </div>
        <div className="min-w-0">
          <StageStrip
            kind={job.weapon}
            lineId={line.id}
            jobId={job.id}
            stageCount={line.stages.length}
            current={idx}
            doneCount={doneCount}
            names={line.stages.map((s) => s.name)}
            onSelect={(i) => setViewIdx(i)}
          />
          <div className="mt-5 stage-enter" key={stage.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl text-fg">{stage.name}</h3>
                <p className="text-sm text-muted">
                  {stage.quest} · {stage.npc}
                </p>
                <p className="text-sm text-subtle">{stage.location}</p>
                {stage.coords && (
                  <p className="mt-1 flex items-start gap-1.5 text-sm tabular text-accent">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span>{stage.coords}</span>
                  </p>
                )}
              </div>
              <Button
                variant={completed.includes(stage.id) ? "primary" : "accent"}
                size="sm"
                onClick={() => {
                  toggleStage(line.id, job.id, stage.id, stageIds);
                  setViewIdx(null);
                }}
              >
                {completed.includes(stage.id) ? "Logged" : "Mark complete"}
              </Button>
            </div>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{stage.summary}</p>
            {stage.phases && stage.phases.length > 0 && (
              <ol className="mt-3 max-w-prose space-y-1.5">
                {stage.phases.map((phase, phaseIndex) => (
                  <li
                    key={phase.name}
                    className="flex items-baseline justify-between gap-3 rounded-md bg-surface-2 px-3 py-2"
                  >
                    <span className="text-sm text-fg">
                      <span className="mr-2 text-xs tabular text-subtle">{phaseIndex + 1}</span>
                      {phase.name}
                    </span>
                    <span className="shrink-0 text-sm tabular text-accent">{phase.rate}</span>
                  </li>
                ))}
              </ol>
            )}
            {start && idx === 0 && (
              <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-sm text-fg">
                <span className="block">{start.relic}</span>
                <span className="mt-1 flex items-start gap-1.5 tabular text-accent">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {start.zone}
                </span>
                <span className="mt-1 block text-muted">Dungeon · {start.dungeon}</span>
              </p>
            )}
            {stage.notes && <p className="mt-3 text-sm text-subtle">{stage.notes}</p>}
          </div>
        </div>
      </div>

      <ItemBlock line={line} job={job} stage={stage} slice={slice} />

      {stage.duties && stage.duties.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-fg">Duties</h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {stage.duties.map((d) => (
              <li
                key={d}
                className="rounded-md bg-surface-2 px-3 py-2 text-sm text-fg shadow-[var(--shadow-border)]"
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Suspense fallback={null}>
        <JobSheet jobId={job.id} expansion={line.expansion} />
      </Suspense>
      <UnlockBlock line={line} />
    </section>
  );
}

function ItemBlock({
  line,
  job,
  stage,
  slice,
}: {
  line: RelicLine;
  job: Job;
  stage: RelicStage;
  slice: ProgressSlice;
}) {
  const [filter, setFilter] = useState<ItemSource | "all">("all");
  const items =
    filter === "all" ? stage.items : stage.items.filter((i) => i.sources.includes(filter));

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h4 className="text-sm font-medium text-fg">Materials</h4>
        <div className="flex flex-wrap gap-1">
          {SOURCE_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "h-8 rounded-full px-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
                filter === s ? "bg-fg text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {s === "all" ? "All" : SOURCE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          {stage.items.length === 0
            ? "This stage has no materials. Log the duty clears."
            : "Nothing in this source."}
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <ItemRow key={item.id} line={line} job={job} item={item} slice={slice} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({
  line,
  job,
  item,
  slice,
}: {
  line: RelicLine;
  job: Job;
  item: RelicItem;
  slice: ProgressSlice;
}) {
  const setCount = useProgress((s) => s.setCount);
  const have = itemCount(slice, line.id, job.id, item);
  const done = have >= item.qty;

  return (
    <li className="rounded-lg bg-surface-2 p-3 shadow-[var(--shadow-border)] sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-sm font-medium", done ? "text-good" : "text-fg")}>{item.name}</p>
            {item.shared && (
              <span className="rounded-full bg-bg px-2 py-0.5 text-xs text-muted">Shared</span>
            )}
            {item.sources.map((s) => (
              <SourceChip key={s} source={s} />
            ))}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">{item.how}</p>
          {item.coords && (
            <p className="mt-1 flex items-start gap-1.5 text-xs tabular text-accent">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span>{item.coords}</span>
            </p>
          )}
          {item.cost && <p className="mt-1 text-xs text-accent">{item.cost}</p>}
          {item.steps && item.steps.length === item.qty && (
            <ul className="mt-3 grid gap-1 sm:grid-cols-2">
              {item.steps.map((step, index) => {
                const on = have > index;
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => setCount(line.id, job.id, item, on && have === index + 1 ? index : index + 1)}
                      className={cn(
                        "w-full rounded-sm px-2 py-1.5 text-left text-xs",
                        on ? "bg-bg text-good" : "text-muted hover:text-fg",
                      )}
                    >
                      {index + 1}. {step}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease"
            className="flex size-11 items-center justify-center rounded-sm bg-bg text-fg"
            onClick={() => setCount(line.id, job.id, item, have - 1)}
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-[3.5rem] text-center text-sm tabular text-fg">
            {have}/{item.qty}
          </span>
          <button
            type="button"
            aria-label="Increase"
            className="flex size-11 items-center justify-center rounded-sm bg-bg text-fg"
            onClick={() => setCount(line.id, job.id, item, have + 1)}
          >
            {done ? <Check className="size-4 text-good" /> : <Plus className="size-4" />}
          </button>
        </div>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${Math.min(100, (have / item.qty) * 100)}%`,
            background: LINE_GLOW[line.id],
          }}
        />
      </div>
      {item.marks && item.marks.length > 0 && (
        <div className="relative mt-1 h-4">
          {item.marks.map((mark) => (
            <span
              key={mark.label}
              className={cn(
                "absolute -translate-x-1/2 text-[0.65rem] tabular",
                have >= mark.at ? "text-good" : "text-subtle",
              )}
              style={{ left: `${Math.min(100, (mark.at / item.qty) * 100)}%` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function SourceChip({ source }: { source: ItemSource }) {
  const tone: Record<ItemSource, string> = {
    farm: "text-farm",
    vendor: "text-buy",
    craft: "text-craft",
    marketboard: "text-market",
    tomestone: "text-accent",
    duty: "text-farm",
    gil: "text-buy",
  };
  return (
    <span className={cn("text-xs font-medium", tone[source])}>{SOURCE_LABEL[source]}</span>
  );
}

function UnlockBlock({ line }: { line: RelicLine }) {
  return (
    <details className="mt-8 rounded-lg bg-surface-2 p-4">
      <summary className="cursor-pointer text-sm font-medium text-fg">Unlock requirements</summary>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
        {line.unlock.map((u) => (
          <li key={u}>{u}</li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-subtle">{line.subsequent}</p>
      <p className="mt-2 text-xs text-subtle">{line.smith}</p>
    </details>
  );
}

function ShoppingView({
  line,
  slice,
  onOpenJob,
}: {
  line: RelicLine;
  slice: ProgressSlice;
  onOpenJob: (id: Job["id"]) => void;
}) {
  const rows = shoppingList(slice, line);
  const [filter, setFilter] = useState<ItemSource | "all">("all");
  const visible = filter === "all" ? rows : rows.filter((r) => r.item.sources.includes(filter));

  return (
    <section className="mt-6 min-w-0 overflow-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)] sm:p-6">
      <h2 className="font-display text-3xl text-fg">Materials</h2>
      <p className="mt-1 text-sm text-muted">{line.name}</p>
      <p className="mt-2 max-w-prose text-sm text-muted">
        What is still required for the next unfinished stage on each {line.short} job. Account-wide
        items are listed once.
      </p>
      <div className="mt-4 flex flex-wrap gap-1">
        {SOURCE_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              "h-8 rounded-full px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60",
              filter === s ? "bg-fg text-accent-fg" : "bg-surface-2 text-muted hover:text-fg",
            )}
          >
            {s === "all" ? "All" : SOURCE_LABEL[s]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          Nothing remaining for this filter.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {visible.map((row) => (
            <li
              key={`${row.jobLabel}-${row.item.id}`}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <span className="w-14 text-xs tracking-wide text-accent">{row.jobLabel}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-fg">{row.item.name}</span>
                {row.item.coords && (
                  <span className="mt-0.5 flex items-start gap-1 text-xs tabular text-accent">
                    <MapPin className="mt-0.5 size-3 shrink-0" />
                    {row.item.coords}
                  </span>
                )}
              </span>
              <span className="flex flex-wrap gap-2">
                {row.item.sources.map((s) => (
                  <SourceChip key={s} source={s} />
                ))}
              </span>
              <span className="tabular text-sm text-muted">
                {row.have}/{row.item.qty}
              </span>
              {row.jobLabel !== "Account" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const found = JOBS.find((j) => j.abbrev === row.jobLabel);
                    if (found) onOpenJob(found.id);
                  }}
                >
                  Open
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
