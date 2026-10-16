export interface Beast {
  n: number;
  name: string;
  kin: string;
  level: number;
  mob: string;
  place: string;
  at: string;
  how: string;
  skills: [string, string, string];
}

/** Master's Bestiary, patch 7.56. Levels are the catch gate. A lower spawn of the same beast still counts. */
export const BEASTS: Beast[] = [
  { n: 1, name: "Cu Sith", kin: "Beastkin", level: 1, mob: "Cu Sith", place: "Job quest", at: "New Gridania", how: "Given when you unlock Beastmaster. No catch.", skills: ["Rake", "Relentless Rake", "Beastskin"] },
  { n: 2, name: "Squirrel", kin: "Beastkin", level: 2, mob: "Ground Squirrel (1–2)", place: "Central Shroud", at: "22.9, 15.9", how: "By the entrance to New Gridania. A White Squirrel B rank in the same zone also counts.", skills: ["Somersault Slash", "Scamper", "Beastskin"] },
  { n: 3, name: "Lamb", kin: "Beastkin", level: 2, mob: "Lost Lamb (3–4)", place: "Middle La Noscea", at: "24.9, 24.1", how: "Zephyr Drift, just south of the Limsa gate. First catch on the way out of the city.", skills: ["Fleece Butt", "Lullaby", "Beastskin"] },
  { n: 4, name: "Pugil", kin: "Wavekin", level: 6, mob: "Pugil (4–6)", place: "Middle La Noscea", at: "19.4, 18.5", how: "In the river at Summerford.", skills: ["Screwdriver", "Water Wall", "Quelling Wave"] },
  { n: 5, name: "Opo-opo", kin: "Beastkin", level: 4, mob: "Opo-opo (5–9)", place: "North Shroud", at: "28.3, 25.1", how: "Treespeak, west of the Gridania entrance. Galago in Lower La Noscea also tames into this beast.", skills: ["Stone Throw", "Pins and Nails", "Beastskin"] },
  { n: 6, name: "Dodo", kin: "Cloudkin", level: 7, mob: "Wild Dodo (4–9)", place: "Lower La Noscea", at: "31.0, 15.0", how: "Cedarwood.", skills: ["Fowl Stench", "Strut", "Cloud Skim"] },
  { n: 7, name: "Coblyn", kin: "Soulkin", level: 6, mob: "Rusty Coblyn (6–8)", place: "Western Thanalan", at: "23.4, 27.4", how: "Hammerlea. Soulkin is the kin you bring when you want that family's actions.", skills: ["Bestial Thunder", "Vulcanize", "Soul Crush"] },
  { n: 8, name: "Diremite", kin: "Vilekin", level: 10, mob: "Diremite (10–12)", place: "Central Shroud", at: "19.7, 18.6", how: "Near Galvanth's Spire.", skills: ["Deadly Thrust", "Silkscreen", "Vileskin"] },
  { n: 9, name: "Megalocrab", kin: "Wavekin", level: 10, mob: "Megalocrab (10–13)", place: "Middle La Noscea", at: "17.4, 13.9", how: "Three-malm Bend. The crab to catch before you leave the zone.", skills: ["Drenching Blow", "Bubble Shower", "Quelling Wave"] },
  { n: 10, name: "Wespe", kin: "Vilekin", level: 10, mob: "Huge Hornet (1–4)", place: "Central Thanalan", at: "Outside Ul'dah", how: "The level 1 bees outside the city gate count. Catch them before the higher hives.", skills: ["Sharp Sting", "Final Sting", "Vileskin"] },
  { n: 11, name: "Vulture", kin: "Cloudkin", level: 6, mob: "Arbor Buzzard (6–13)", place: "Western Thanalan", at: "The Footfalls", how: "Nesting Buzzards in the same zone also count.", skills: ["Wing Cutter", "Bloodcurdling Caw", "Cloud Skim"] },
  { n: 12, name: "Mandragora", kin: "Seedkin", level: 5, mob: "Tiny Mandragora (5–7)", place: "Middle La Noscea", at: "21.8, 18.4", how: "Eastern Summerford.", skills: ["Budbutt", "Heirloom Scream", "Seedsower"] },
  { n: 13, name: "Geshunpest", kin: "Ashkin", level: 14, mob: "Geshunpest (14)", place: "Central Shroud", at: "19.0, 27.0", how: "Near Tam-Tara Deepcroft. The ones in Seasong Grotto also count.", skills: ["Dark Thunder", "Odium", "Scouring Ash"] },
  { n: 14, name: "Puk", kin: "Scalekin", level: 4, mob: "Puk Hatchling (4–8)", place: "Middle La Noscea", at: "21.7, 19.5", how: "Western Summerford.", skills: ["Fireball", "Tail Chase", "Scaleskin"] },
  { n: 15, name: "Crab", kin: "Wavekin", level: 13, mob: "Thickshell (13)", place: "Western Thanalan", at: "16.9, 13.8", how: "The Footfalls. A gourd from the Crucible vendor skips a dry spawn.", skills: ["Bubble Shower", "Hundred Fists", "Quelling Wave"] },
  { n: 16, name: "Mantis", kin: "Vilekin", level: 16, mob: "Killer Mantis (16)", place: "Western La Noscea", at: "21.9, 23.4", how: "Either side of Camp Skull Valley. Halatali is the faster catch when the field is crowded.", skills: ["Standing Chine", "Eerie Soundwave", "Vileskin"] },
  { n: 17, name: "Slime", kin: "Ashkin", level: 17, mob: "Sewer Syrup", place: "Copperbell Mines", at: "Guildhest or dungeon", how: "Copperbell Mines, the level 30 guildhest More than a Feeler, or the Slime B rank in Western Thanalan. Gourd if the pull dies too fast.", skills: ["Digest", "Syrup", "Scouring Ash"] },
  { n: 18, name: "Dullahan", kin: "Soulkin", level: 20, mob: "Doctore", place: "Halatali", at: "Dungeon", how: "Halatali. Gourd from the Crucible vendor.", skills: ["Iron Justice", "King's Will", "Soul Crush"] },
  { n: 19, name: "Bat", kin: "Cloudkin", level: 7, mob: "Cave Bat (7)", place: "Lower La Noscea", at: "26.6, 15.3", how: "Cedarwood, by Blind Iron Mines. A Bat B rank in the zone also counts.", skills: ["Blood Drain", "Ultrasonics", "Cloud Skim"] },
  { n: 20, name: "Flying Trap", kin: "Seedkin", level: 10, mob: "Roselet (10)", place: "Central Shroud", at: "22.9, 26.1", how: "Bentbranch. Look for Roselets, not the higher traps.", skills: ["Sour Sough", "Necrotic Nectar", "Seedsower"] },
  { n: 21, name: "Ziz", kin: "Scalekin", level: 16, mob: "Rothlyt Pelican (16)", place: "Western La Noscea", at: "South of Camp Skull Valley", how: "In front of the camp entrance.", skills: ["Ice Breath", "Petribreath", "Scaleskin"] },
  { n: 22, name: "Sabotender", kin: "Seedkin", level: 3, mob: "Cactuar (3–4)", place: "Western Thanalan", at: "28.5, 24.9", how: "The Eighty Sins of Sasamo. Grab it on the way to the coblyns.", skills: ["Natural Needles", "Hypodermic Hustle", "Seedsower"] },
  { n: 23, name: "Golem", kin: "Soulkin", level: 25, mob: "Sandstone Golem (29)", place: "Southern Thanalan", at: "23.8, 12.4", how: "By the Sunken Temple of Qarn. FATE That Which Binds Us (16.5, 29.3) and FATE Soul Man also count.", skills: ["Boulder Clap", "Rockslide", "Soul Crush"] },
  { n: 24, name: "Apkallu", kin: "Cloudkin", level: 30, mob: "Apkallu (30)", place: "Eastern La Noscea", at: "29.2, 35.1", how: "The field flock. Stay for this once you are 30.", skills: ["Flying Sardine", "Regurgitate", "Cloud Skim"] },
  { n: 25, name: "Adamantoise", kin: "Scalekin", level: 12, mob: "Giant Tortoise (12–17)", place: "Central Thanalan", at: "22.7, 29.3", how: "Five spawns across the Spineless Basin. Take a level 12 if you are not 17 yet.", skills: ["Bestial Thunder II", "Harden Shell", "Scaleskin"] },
  { n: 26, name: "Buffalo", kin: "Beastkin", level: 9, mob: "Wounded Aurochs (8)", place: "Middle La Noscea", at: "18.5, 17.2", how: "Summerford. The wounded ones are the low catch.", skills: ["Heave", "War Cry", "Beastskin"] },
  { n: 27, name: "Uragnite", kin: "Wavekin", level: 14, mob: "Scaphite (14)", place: "Western Thanalan", at: "17.5, 15.0", how: "Near the Footfalls. Catch it with the Thickshell.", skills: ["Frost Breath", "Gas Shell", "Quelling Wave"] },
  { n: 28, name: "Worm", kin: "Vilekin", level: 31, mob: "Sandworm (31–32)", place: "Southern Thanalan", at: "19.5, 32.4", how: "Field sandworms. Gourd if you would rather not wait on a burrow.", skills: ["Sand Breath", "Bottomless Desert", "Vileskin"] },
  { n: 29, name: "Spriggan", kin: "Soulkin", level: 7, mob: "Spriggan Graverobber (7)", place: "Central Thanalan", at: "17.3, 23.4", how: "The graves outside Ul'dah.", skills: ["Romp", "Frenetic Flurry", "Soul Crush"] },
  { n: 30, name: "Goobbue", kin: "Beastkin", level: 12, mob: "Mossless Goobbue (12–17)", place: "Lower La Noscea", at: "21.1, 23.5", how: "Spawns are spread out. The level 17 ones are the reliable catch.", skills: ["Beatdown", "Moldy Sneeze", "Beastskin"] },
  { n: 31, name: "Gigantoad", kin: "Wavekin", level: 4, mob: "Rivertoad (4)", place: "Lower La Noscea", at: "23.9, 22.0", how: "The river. Catch it before you walk up to the goobbues.", skills: ["Bestial Blizzard II", "Sticky Tongue", "Quelling Wave"] },
  { n: 32, name: "Colibri", kin: "Cloudkin", level: 33, mob: "Colibri (33)", place: "Eastern La Noscea", at: "29.7, 24.7", how: "The highest field bird in the zone. Do not leave without it.", skills: ["Loop", "Pecking Flurry", "Cloud Skim"] },
  { n: 33, name: "Coeurl", kin: "Beastkin", level: 24, mob: "Master Coeurl", place: "Upper La Noscea", at: "9.2, 21.5", how: "The coeurl camp near Camp Overlook. Chopper in Sastasha also tames into Coeurl.", skills: ["Blaster", "Charged Whisker", "Beastskin"] },
  { n: 34, name: "Raptor", kin: "Scalekin", level: 3, mob: "Anole (9)", place: "Central Shroud", at: "30.7, 20.1", how: "A low catch on the way through the Shroud.", skills: ["Frost Breath", "Foul Breath", "Scaleskin"] },
  { n: 35, name: "Drake", kin: "Scalekin", level: 32, mob: "Sundrake (32)", place: "Southern Thanalan", at: "24.4, 39.3", how: "Field sundrakes. Gourd, or the guildhest The Missing Merchant.", skills: ["Burning Cyclone", "Smoldering Scales", "Scaleskin"] },
  { n: 36, name: "Treant", kin: "Seedkin", level: 12, mob: "Treant Sapling (12)", place: "Central Shroud", at: "27.9, 15.3", how: "Catch the sapling. Older treants are the same beast only if you can survive them.", skills: ["Acorn Bomb", "Arboreal Storm", "Seedsower"] },
  { n: 37, name: "Antling", kin: "Vilekin", level: 38, mob: "Myrmidon Marshal", place: "Cutter's Cry", at: "First boss", how: "Stop damage under 10%, then Capture. Gourd if the boss dies in one pull.", skills: ["Mandible Bite", "Formic Pheromones", "Vileskin"] },
  { n: 38, name: "Chimera", kin: "Beastkin", level: 38, mob: "Chimera", place: "Cutter's Cry", at: "Last boss", how: "Also A Relic Reborn: the Chimera, and FATE Gorgimera in Northern Thanalan. Gourd works.", skills: ["The Lion's Breath", "The Ram's Voice", "Beastskin"] },
  { n: 39, name: "Morbol", kin: "Seedkin", level: 31, mob: "Stroper (31)", place: "Central Shroud", at: "13.6, 21.8", how: "Stropers and Halitostropers. The level 30 guildhest More than a Feeler also counts.", skills: ["Vine Probe", "Bad Breath", "Seedsower"] },
  { n: 40, name: "Ghost", kin: "Ashkin", level: 7, mob: "Bogy (7)", place: "Middle La Noscea", at: "20.2, 18.7", how: "Summerford bogeys.", skills: ["Fell Gale", "Curse", "Scouring Ash"] },
  { n: 41, name: "Salamander", kin: "Wavekin", level: 6, mob: "Black Eft (6)", place: "Central Shroud", at: "26.6, 19.8", how: "A low wavekin on the same loop as the squirrels.", skills: ["Brackish Rain", "Peculiar Light", "Quelling Wave"] },
  { n: 42, name: "Cobra", kin: "Scalekin", level: 20, mob: "Lake Cobra (45)", place: "Mor Dhona", at: "The lake", how: "The field cobra is 45. Halatali, after the first boss, is the lower catch.", skills: ["Dripping Fang", "Stone Gaze", "Scaleskin"] },
  { n: 43, name: "Hydra", kin: "Scalekin", level: 50, mob: "Hydra", place: "A Relic Reborn: the Hydra", at: "Trial", how: "Hold damage under 5% so Capture lands. Gourd from the Crucible vendor.", skills: ["Main Trap", "White Breath", "Scaleskin"] },
  { n: 44, name: "Damselfly", kin: "Vilekin", level: 50, mob: "Gadfly", place: "The Lost City of Amdapor", at: "Dungeon", how: "Monarch Ogrefly in South Shroud is the field catch at 50. Gourd if the dungeon dies too fast.", skills: ["Cursed Sphere", "Venom", "Vileskin"] },
  { n: 45, name: "Rotting Goobbue", kin: "Ashkin", level: 50, mob: "Rotting Goobbue", place: "The Lost City of Amdapor", at: "Dungeon", how: "Same duty as the damselfly. One run can take both if you hold the last hit.", skills: ["Dirty Sneeze", "Inhale", "Scouring Ash"] },
  { n: 46, name: "Zu", kin: "Cloudkin", level: 50, mob: "Cornu", place: "Pharos Sirius", at: "Dungeon", how: "Also a Zu FATE. Gourd if the duty is a bad run.", skills: ["Flying Frenzy", "Breath Wing", "Cloud Skim"] },
  { n: 47, name: "Ice Golem", kin: "Soulkin", level: 50, mob: "Ice Golem", place: "Snowcloak", at: "Dungeon", how: "Snowcloak, or the Akh Afah Amphitheatre (Hard). Gourd otherwise.", skills: ["Ice Guillotine", "Frozen Heart", "Soul Crush"] },
  { n: 48, name: "Karlabos", kin: "Wavekin", level: 50, mob: "Karlabos", place: "Sastasha (Hard)", at: "Last boss", how: "Hold the last sliver of health. Gourd if the party will not wait.", skills: ["Impale", "Tail Screw", "Quelling Wave"] },
  { n: 49, name: "Rafflesia", kin: "Seedkin", level: 50, mob: "Rafflesia", place: "The Second Coil of Bahamut", at: "Turn 1", how: "Turn 1. Gourd from the Crucible vendor.", skills: ["Bloody Caress", "Blighted Bouquet", "Seedsower"] },
  { n: 50, name: "Behemoth", kin: "Beastkin", level: 50, mob: "Behemoth", place: "The Labyrinth of the Ancients", at: "Alliance raid", how: "Have the raid stop around 5% so every Beastmaster can Capture. One kill can fill the alliance. Gourd if you miss it.", skills: ["Thunderbolt", "Meteor", "Beastskin"] },
];

export const HORN_PLAN = [
  {
    horn: "Ranged",
    kin: "Wavekin",
    button: "Quelling Wave",
    why: "A ranged water hit. It also strips one buff from the target. Pugil covers this early. Megalocrab, then Gigantoad or Karlabos, later.",
  },
  {
    horn: "Interrupt",
    kin: "Soulkin",
    button: "Soul Crush",
    why: "Interrupts a cast. Any Soulkin works. Coblyn is the early catch. Spriggan and Ice Golem are the ones the Crucible boards call for.",
  },
  {
    horn: "Packs",
    kin: "Beastkin",
    button: "Beastskin",
    why: "Cuts physical damage taken and raises critical rate. Chimera freezes a pack with The Ram's Voice. Buffalo stuns with Heave. Cu Sith holds the horn until then.",
  },
];

export const NAMED_SWAPS = [
  "Treant: Acorn Bomb is a Nightmare you can keep casting while the beast is out. It is a Trick, not the one Borrow.",
  "Coeurl: Blaster is a paralysis and a damage cut.",
  "Bat: Blood Drain is the heal.",
  "Geshunpest: Scouring Ash removes one harmful effect.",
  "Wespe, Mantis, and Damselfly: a burn set for a boss that dies before you need an interrupt. It is not the set for every fight.",
];

export const BEAST_STEPS = [
  "Unlock at the Excited Adventurer in New Gridania (11.8, 13.6), quest Strangers in the Wood. You need Dawntrail, one combat job at 50, and the quest The Ultimate Weapon. Cu Sith is handed to you.",
  "Beastmaster stops at 50. The catch checks the enemy you are hitting, so a lower spawn of that beast is valid. Expansion field monsters are above the cap and will not tame.",
  "Raise the job, then catch in level order. Weaken the target under 10% (under 5% if it is sturdy) and use Capture. It is your own mark. A whole party can catch the same enemy.",
  "The first horn is at level 1, the second at 10, and the third at 20. Level in FATEs until 15, then in the highest dungeon you can enter. Borrow is level 22.",
  "Call a beast before the pull. Each summon lets you use Tempered Release or Borrow once, not both. Parting Blow is the exit, not a filler.",
  "Duty beasts are also gourds. The Crucible vendor's stock grows after the second board of the Crucible of the Unbroken.",
];
