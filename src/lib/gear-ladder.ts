export interface GearStep {
  expansion: string;
  level: number;
  itemLevel: number;
  set: string;
  source: string;
}

/** Catch-up sets the tomestone table documents. Not a per-job meld list. */
export const GEAR_LADDER: GearStep[] = [
  {
    expansion: "A Realm Reborn",
    level: 50,
    itemLevel: 130,
    set: "Ironworks",
    source: "Allagan Tomestones of Poetics.",
  },
  {
    expansion: "Heavensward",
    level: 60,
    itemLevel: 270,
    set: "Shire",
    source: "Allagan Tomestones of Poetics.",
  },
  {
    expansion: "Stormblood",
    level: 70,
    itemLevel: 400,
    set: "Scaevan",
    source: "Allagan Tomestones of Poetics.",
  },
  {
    expansion: "Shadowbringers",
    level: 80,
    itemLevel: 530,
    set: "Augmented Cryptlurker",
    source: "Allagan Tomestones of Poetics, in Eulmore.",
  },
  {
    expansion: "Endwalker",
    level: 90,
    itemLevel: 660,
    set: "Augmented Credendum",
    source: "Allagan Tomestones of Poetics. Cihanti in Radz-at-Han (10.8, 10.4).",
  },
  {
    expansion: "Dawntrail",
    level: 100,
    itemLevel: 780,
    set: "Bygone Brass",
    source: "Allagan Tomestones of Mnemonics. This is the buyable set as of patch 7.56.",
  },
  {
    expansion: "Dawntrail",
    level: 100,
    itemLevel: 790,
    set: "Augmented Bygone Brass or Grand Champion",
    source: "Upgrade Bygone Brass, or take Grand Champion from Arcadion Savage. The savage weapon is item level 795. Patch 7.57 did not add a new tier.",
  },
];
