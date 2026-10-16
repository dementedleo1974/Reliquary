export type Role = "tank" | "healer" | "melee" | "ranged" | "caster";

export type WeaponKind =
  | "sword"
  | "axe"
  | "greatsword"
  | "gunblade"
  | "fist"
  | "polearm"
  | "daggers"
  | "katana"
  | "scythe"
  | "twinblades"
  | "bow"
  | "firearm"
  | "chakrams"
  | "staff"
  | "grimoire"
  | "rapier"
  | "brush"
  | "cane"
  | "codex"
  | "globe"
  | "nouliths";

export type ItemSource = "farm" | "vendor" | "craft" | "marketboard" | "tomestone" | "duty" | "gil";

export type JobId =
  | "pld"
  | "war"
  | "drk"
  | "gnb"
  | "mnk"
  | "drg"
  | "nin"
  | "sam"
  | "rpr"
  | "vpr"
  | "brd"
  | "mch"
  | "dnc"
  | "blm"
  | "smn"
  | "rdm"
  | "pct"
  | "whm"
  | "sch"
  | "ast"
  | "sge";

export type LineId = "zodiac" | "anima" | "eureka" | "resistance" | "manderville" | "phantom";

export interface Job {
  id: JobId;
  name: string;
  abbrev: string;
  role: Role;
  weapon: WeaponKind;
  since: LineId;
}

export interface RelicItem {
  id: string;
  name: string;
  qty: number;
  sources: ItemSource[];
  how: string;
  /** Map pin, when the item has a vendor or a fixed spot. */
  coords?: string;
  cost?: string;
  /** Account-wide, completed once then skipped on later jobs. */
  shared?: boolean;
  optional?: boolean;
}

export interface RelicPhase {
  name: string;
  rate: string;
}

export interface RelicStage {
  id: string;
  name: string;
  ilvl: number;
  quest: string;
  npc: string;
  location: string;
  /** Map pin for the quest NPC, vendor, or turn-in. */
  coords?: string;
  summary: string;
  items: RelicItem[];
  duties?: string[];
  notes?: string;
  /** Chance for each phase of a random step. */
  phases?: RelicPhase[];
}

export interface JobStart {
  dungeon: string;
  zone: string;
  relic: string;
}

export interface RelicLine {
  id: LineId;
  expansion: string;
  patch: string;
  level: number;
  name: string;
  short: string;
  smith: string;
  art: string;
  unlock: string[];
  subsequent: string;
  stages: RelicStage[];
  jobStarts?: Partial<Record<JobId, JobStart>>;
  weaponNames: Partial<Record<JobId, { base: string; final: string; extra?: string }>>;
}
