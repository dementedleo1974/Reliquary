import type { Job, LineId } from "./types";

export const JOBS: Job[] = [
  { id: "pld", name: "Paladin", abbrev: "PLD", role: "tank", weapon: "sword", since: "zodiac" },
  { id: "war", name: "Warrior", abbrev: "WAR", role: "tank", weapon: "axe", since: "zodiac" },
  { id: "drk", name: "Dark Knight", abbrev: "DRK", role: "tank", weapon: "greatsword", since: "anima" },
  { id: "gnb", name: "Gunbreaker", abbrev: "GNB", role: "tank", weapon: "gunblade", since: "resistance" },
  { id: "mnk", name: "Monk", abbrev: "MNK", role: "melee", weapon: "fist", since: "zodiac" },
  { id: "drg", name: "Dragoon", abbrev: "DRG", role: "melee", weapon: "polearm", since: "zodiac" },
  { id: "nin", name: "Ninja", abbrev: "NIN", role: "melee", weapon: "daggers", since: "zodiac" },
  { id: "sam", name: "Samurai", abbrev: "SAM", role: "melee", weapon: "katana", since: "eureka" },
  { id: "rpr", name: "Reaper", abbrev: "RPR", role: "melee", weapon: "scythe", since: "manderville" },
  { id: "vpr", name: "Viper", abbrev: "VPR", role: "melee", weapon: "twinblades", since: "phantom" },
  { id: "brd", name: "Bard", abbrev: "BRD", role: "ranged", weapon: "bow", since: "zodiac" },
  { id: "mch", name: "Machinist", abbrev: "MCH", role: "ranged", weapon: "firearm", since: "anima" },
  { id: "dnc", name: "Dancer", abbrev: "DNC", role: "ranged", weapon: "chakrams", since: "resistance" },
  { id: "blm", name: "Black Mage", abbrev: "BLM", role: "caster", weapon: "staff", since: "zodiac" },
  { id: "smn", name: "Summoner", abbrev: "SMN", role: "caster", weapon: "grimoire", since: "zodiac" },
  { id: "rdm", name: "Red Mage", abbrev: "RDM", role: "caster", weapon: "rapier", since: "eureka" },
  { id: "pct", name: "Pictomancer", abbrev: "PCT", role: "caster", weapon: "brush", since: "phantom" },
  { id: "whm", name: "White Mage", abbrev: "WHM", role: "healer", weapon: "cane", since: "zodiac" },
  { id: "sch", name: "Scholar", abbrev: "SCH", role: "healer", weapon: "codex", since: "zodiac" },
  { id: "ast", name: "Astrologian", abbrev: "AST", role: "healer", weapon: "globe", since: "anima" },
  { id: "sge", name: "Sage", abbrev: "SGE", role: "healer", weapon: "nouliths", since: "manderville" },
];

const LINE_ORDER: LineId[] = [
  "zodiac",
  "anima",
  "eureka",
  "resistance",
  "manderville",
  "phantom",
];

export function jobsForLine(lineId: LineId): Job[] {
  const idx = LINE_ORDER.indexOf(lineId);
  return JOBS.filter((job) => LINE_ORDER.indexOf(job.since) <= idx);
}

export const ROLE_LABEL: Record<Job["role"], string> = {
  tank: "Tank",
  healer: "Healer",
  melee: "Melee",
  ranged: "Ranged",
  caster: "Caster",
};
