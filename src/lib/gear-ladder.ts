export interface GearStep {
  expansion: string;
  level: number;
  itemLevel: string;
  set: string;
  source: string;
}

/**
 * Final tomestone sets from the Console Games Wiki tomestone table.
 * The higher number is the augmented piece. Dawntrail's 790 step is the
 * 7.56 gearing ladder; patch 7.57 did not publish a new set.
 */
export const GEAR_LADDER: GearStep[] = [
  {
    expansion: "A Realm Reborn",
    level: 50,
    itemLevel: "120–130",
    set: "Ironworks",
    source: "Allagan Tomestones of Poetics. Buy the item level 130 piece.",
  },
  {
    expansion: "Heavensward",
    level: 60,
    itemLevel: "260–270",
    set: "Shire",
    source: "Allagan Tomestones of Poetics. Buy the item level 270 piece.",
  },
  {
    expansion: "Stormblood",
    level: 70,
    itemLevel: "390–400",
    set: "Scaevan",
    source: "Allagan Tomestones of Poetics. Buy the item level 400 piece.",
  },
  {
    expansion: "Shadowbringers",
    level: 80,
    itemLevel: "520–530",
    set: "Cryptlurker",
    source: "Allagan Tomestones of Poetics, in Eulmore. Buy the item level 530 piece.",
  },
  {
    expansion: "Endwalker",
    level: 90,
    itemLevel: "650–660",
    set: "Credendum",
    source: "Allagan Tomestones of Poetics. Cihanti in Radz-at-Han (10.8, 10.4). Buy the item level 660 piece.",
  },
  {
    expansion: "Dawntrail",
    level: 100,
    itemLevel: "780",
    set: "Bygone Brass",
    source: "Allagan Tomestones of Mnemonics, the capped Dawntrail tomestone.",
  },
  {
    expansion: "Dawntrail",
    level: 100,
    itemLevel: "790",
    set: "Augmented Bygone Brass or Grand Champion",
    source: "Augment Bygone Brass, or take Grand Champion from Arcadion Savage. The savage weapon is item level 795.",
  },
];
