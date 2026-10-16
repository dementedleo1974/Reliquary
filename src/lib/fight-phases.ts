export interface FightPhase {
  name: string;
  pf: string;
  wipe: string;
}

/** Short original notes. One Party Finder name, and the mistake that ends the pull. */
export const FIGHT_PHASES: Record<string, FightPhase[]> = {
  "the Unending Coil of Bahamut (Ultimate)": [
    { name: "Twintania", pf: "Neurolinks, generate", wipe: "Moving as a twister goes off, or a Death Sentence with no tank swap." },
    { name: "Nael", pf: "Quote order", wipe: "A missed Heavensfall or Megaflare quote." },
    { name: "Bahamut Prime", pf: "Towers and stacks", wipe: "An empty tower." },
    { name: "Adds", pf: "Quickmarch, Blackfire", wipe: "A fire bait on the party instead of the assigned spot." },
    { name: "Golden Bahamut", pf: "Exaflares", wipe: "A clipped exaflare, or the enrage." },
  ],
  "the Weapon's Refrain (Ultimate)": [
    { name: "Garuda", pf: "Feather baits", wipe: "A feather dropped on the group." },
    { name: "Ifrit", pf: "Nails", wipe: "A nail left in the center, or a dash through the party." },
    { name: "Titan", pf: "Gaols", wipe: "A gaol placed in the landslide." },
    { name: "Ultima", pf: "Predation, Suppression", wipe: "A predation bait in the wrong clock spot." },
  ],
  "the Epic of Alexander (Ultimate)": [
    { name: "Living Liquid", pf: "Limit Cut", wipe: "A number resolving out of order." },
    { name: "Brute Justice and Cruise Chaser", pf: "Nisi", wipe: "A nisi passed to the wrong role." },
    { name: "Alexander Prime", pf: "Wormhole, Inception", wipe: "A temporal spot taken by the wrong player." },
    { name: "Perfect Alexander", pf: "Fate Calibration", wipe: "The enrage wormhole." },
  ],
  "Dragonsong's Reprise (Ultimate)": [
    { name: "Vault knights", pf: "Wings and chains", wipe: "A tether broken in the wrong place." },
    { name: "Thordan", pf: "Strength of the Ward", wipe: "A tower or meteor in the wrong spot." },
    { name: "Nidhogg", pf: "Hallowed Wings", wipe: "The wrong debuff soaking a tower." },
    { name: "Eyes", pf: "Wrath and Sanctity", wipe: "Looking at the wrong head." },
    { name: "Thordan II", pf: "Death of the Heavens", wipe: "A doomsday tower left empty." },
    { name: "Double dragons", pf: "Akh Afah, exaflares", wipe: "A tank missing the Akh Morn, or the enrage." },
  ],
  "the Omega Protocol (Ultimate)": [
    { name: "Omega", pf: "Program Loop, Party Synergy", wipe: "A synergy tower taken alone." },
    { name: "Omega-M and Omega-F", pf: "Limitless Synergy", wipe: "A stack on the wrong side." },
    { name: "Blue Screen", pf: "Hello World", wipe: "A defamation dropped on the party, or a wrong monitor." },
    { name: "Run: Dynamis", pf: "Wave cannons", wipe: "A cannon aimed through the party." },
    { name: "Alpha Omega", pf: "Delta, Sigma, Omega", wipe: "A failed delta tower." },
    { name: "Cosmo Memory", pf: "Exaflares", wipe: "The enrage." },
  ],
  "Futures Rewritten (Ultimate)": [
    { name: "Fatebreaker", pf: "Utopian Sky, Light Rampant", wipe: "A Light Rampant tower or stack taken by the wrong role." },
    { name: "Usurper of Frost", pf: "Mirror Mirror", wipe: "A mirror bait on the wrong clone." },
    { name: "Oracle of Darkness", pf: "Darklit Dragonsong", wipe: "A dark fire paired with the wrong player." },
    { name: "Pandaemonium", pf: "Akh Morn", wipe: "A tank not taking the Akh Morn." },
    { name: "Ultima", pf: "Crystallize Time", wipe: "The enrage exaflares." },
  ],
  "Dancing Mad (Ultimate)": [
    { name: "Kefka", pf: "Kefkabin, Merry-Go-Round", wipe: "Acting on a fake tell." },
    { name: "God Kefka", pf: "AAABBBBA, 3-4-1", wipe: "Ultimate Embrace not shared, or a missed flex." },
    { name: "Chaos and Exdeath", pf: "Tank LB3, old or new black holes", wipe: "A black hole bait on the wrong clock spot." },
    { name: "Kefka Says", pf: "Real and fake casts", wipe: "Resolving a fake cast, or missing the 25% check into Ultima Upsurge." },
    { name: "Ultima Kefka", pf: "Ultima Repeater, Fell Forces", wipe: "The opener raidwide, or a broken tank, healer, and DPS stack." },
  ],
  "AAC Heavyweight M1 (Savage)": [
    { name: "Vamp Fatale", pf: "Toxic Friends", wipe: "A missed Insatiable Thirst or Sadistic Screech." },
    { name: "Adds", pf: "Buzzsaws", wipe: "Touching a saw in the small arena." },
    { name: "Aetherletting", pf: "Toxic Friends", wipe: "A swapped pair on the towers." },
  ],
  "AAC Heavyweight M2 (Savage)": [
    { name: "Red Hot, then Deep Blue", pf: "Hector", wipe: "The death wall, or a Flame Floater tether dropped on the party." },
    { name: "Insane Air", pf: "Hector", wipe: "The wrong surfboard shape: spread, stack, or tankbuster." },
  ],
};
