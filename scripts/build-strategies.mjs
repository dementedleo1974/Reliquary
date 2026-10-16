/**
 * Strategy cards for Savage, Ultimate, and Chaotic duties.
 * Notes are short original plans. Full resolutions stay on the linked guides.
 */
import fs from "node:fs";

const places = JSON.parse(fs.readFileSync("public/atlas-places.json", "utf8")).places;
const targets = places.filter((place) => /\((Savage|Ultimate|Chaotic)\)/.test(place.name));

const naur = {
  "AAC Light-heavyweight M1 (Savage)": "https://naurffxiv.com/savage/m1s/guide",
  "AAC Light-heavyweight M2 (Savage)": "https://naurffxiv.com/savage/m2s",
  "AAC Light-heavyweight M3 (Savage)": "https://naurffxiv.com/savage/m3s",
  "AAC Light-heavyweight M4 (Savage)": "https://naurffxiv.com/savage/m4s",
  "AAC Cruiserweight M1 (Savage)": "https://naurffxiv.com/savage/m5s",
  "AAC Cruiserweight M2 (Savage)": "https://naurffxiv.com/savage/m6s",
  "AAC Cruiserweight M3 (Savage)": "https://naurffxiv.com/savage/m7s",
  "AAC Cruiserweight M4 (Savage)": "https://naurffxiv.com/savage/m8s",
  "AAC Heavyweight M1 (Savage)": "https://naurffxiv.com/savage/m9s",
  "AAC Heavyweight M2 (Savage)": "https://naurffxiv.com/savage/m10s",
  "AAC Heavyweight M3 (Savage)": "https://naurffxiv.com/savage/m11s",
  "AAC Heavyweight M4 (Savage)": "https://naurffxiv.com/savage/m12s",
  "The Weapon's Refrain (Ultimate)": "https://naurffxiv.com/ultimate/uwu",
  "The Unending Coil of Bahamut (Ultimate)": "https://naurffxiv.com/ultimate/ucob",
  "The Epic of Alexander (Ultimate)": "https://naurffxiv.com/ultimate/tea",
  "Dragonsong's Reprise (Ultimate)": "https://naurffxiv.com/ultimate/dsr",
  "The Omega Protocol (Ultimate)": "https://naurffxiv.com/ultimate/top",
  "Futures Rewritten (Ultimate)": "https://naurffxiv.com/ultimate/fru",
  "Dancing Mad (Ultimate)": "https://naurffxiv.com/ultimate/kefka",
};

/** @type {Record<string, { pf: string, steps: string[] }>} */
const specific = {
  "AAC Light-heavyweight M1 (Savage)": {
    pf: "NAUR Black Cat guide. One protean order for every Quadruple Crossing.",
    steps: [
      "Bait proteans on intercards, damage dealers first and supports second. Supports then rotate counterclockwise and damage dealers clockwise into the partner stacks.",
      "One-Two Paw: take the safe side of the first clone, then cross to the safe side of the second. Keep the same light-party spots as the proteans.",
      "Mouser breaks tiles until four remain in a line. Start beside the first tile that pops. The role that was not marked does the second Mouser.",
    ],
  },
  "AAC Light-heavyweight M4 (Savage)": {
    pf: "Shabin. Say AutoCAD or Normal Sunrise in the party description, not both.",
    steps: [
      "AutoCAD baits cannons on the marker edge toward the nearest tower. Normal Sunrise baits them into the wall, away from that tower.",
      "Exaflares: melee stay close, ranged stay far, supports bait first.",
      "Mustard Bomb is a square. Midnight Sabbath pairs the main tank with H1; intercards rotate counterclockwise.",
      "Ion cannons stay north-south. Supports take the boss-left side and damage dealers the boss-right side.",
    ],
  },
  "AAC Cruiserweight M1 (Savage)": {
    pf: "Hector. Use Hector's markers.",
    steps: [
      "Agree the Hector video before the pull. Clock spots are north, east, south, west, then the four intercards.",
      "Treat each chorus as the same positions. Do not freestyle a later loop because the song sped up.",
      "The NAUR page is the checklist. If the description does not say Hector, ask before you zone in.",
    ],
  },
  "AAC Heavyweight M2 (Savage)": {
    pf: "Hector, then one of Toxic Friends, Nomnom, or Parallel.",
    steps: [
      "The description must name the add-phase tether plan. Parallel keeps the two boss tethers parallel. Do not mix it with a cross plan.",
      "Nomnom is the fire and water snake. Toxic Friends is the common raidplan and marker preset.",
      "Put the markers down before the countdown. A missing waymark is a wipe on the first orb set.",
    ],
  },
  "AAC Heavyweight M3 (Savage)": {
    pf: "Hector. Toxic No Buddies or Kindred No Buddies, plus Fixed or Uptime stampede.",
    steps: [
      "No Buddies means prey does not pair for the tower knockbacks. Toxic Friends and Kindred stand on different static markers for the same flatliner.",
      "Ecliptic Stampede is either Fixed or Uptime. The description has to pick one.",
      "The last towers are written as letters: P is a party soak and T is a tank soak. PTT means party, then tank, then tank.",
    ],
  },
  "AAC Heavyweight M4 (Savage)": {
    pf: "Phase 1: Toxic Friends or Roles Mortal Slayer. Phase 2: Modified Bin, DN Replication, DN Idyllic, 3-1 orbs.",
    steps: [
      "Phase 1 and phase 2 use different marker presets. Swap them when the arena changes.",
      "Mortal Slayer is not the Toxic Friends plan. Only one of those names should be in the description.",
      "Phase 2 soaks are counted. 3-1 means three players, then one. Call the soak out loud.",
      "Replication and Idyllic are directed north. Stand where the named plan puts your role, not where the normal mode stood.",
    ],
  },
  "The Weapon's Refrain (Ultimate)": {
    pf: "Standard Ultimate Weapon. Garuda, Ifrit, Titan, then Ultima.",
    steps: [
      "Garuda: slipstream is a line, wicked wheel is a donut, and the mesohigh tethers go to the healers. Do not kill the spiny plume early.",
      "Ifrit: nails are positions, not a burn. Dash and eruptions resolve away from the nails.",
      "Titan: gaols are a cleanse puzzle. Upheaval and landslides do not overlap a gaol spot.",
      "Ultima: Predation, Suppression, and Annihilation are body checks. A death there is a wipe. Hold the limit break for the quoted call.",
    ],
  },
  "The Unending Coil of Bahamut (Ultimate)": {
    pf: "Standard Coil. Twintania, Nael quotes, Bahamut, adds, Golden.",
    steps: [
      "Twintania: neurolink soaks, generate stacks, and a shared dive. The hatch is a placement, not extra damage.",
      "Nael speaks in quotes. The quote order is the mechanic order. Stack, spread, and tower follow the words, not the cast bar.",
      "Bahamut: Quickmarch, Blackfire, and Fellruin are trio mechanics. Do the first trio clean before you learn the later ones.",
      "Golden Bahamut repeats the trios with less room. Deaths do not get raised into a quote.",
    ],
  },
  "The Epic of Alexander (Ultimate)": {
    pf: "Standard Alexander. Liquid, Brute Justice and Cruise Chaser, then Perfect.",
    steps: [
      "Living Liquid is the limit-cut and throttle check. Proteans and stacks use the same clock the party marked.",
      "Brute Justice and Cruise Chaser pass nisi. A dropped nisi is a damage down and usually a wipe.",
      "Wormhole and the inception loops are simmed, not memorized mid-pull. Run the sim the party named.",
      "Perfect Alexander is the enrage puzzle. If the earlier phases were messy, reset rather than walk into Perfect.",
    ],
  },
  "Dragonsong's Reprise (Ultimate)": {
    pf: "The party's written plan for Death of the Heavens, Wroth Flames, and the final dragons.",
    steps: [
      "Thordan and Nidhogg are the tutorial. The towers, dives, and eye tethers are the same language as the later phases.",
      "Death of the Heavens and Wroth Flames are the two plans people mix. The description should name which north-south priority you are using.",
      "The dragon phase is Akh Morn and divebombs. A tank death during Akh Morn ends the pull.",
      "Learn one phase at a time. Do not change the doom or tower priority after the countdown starts.",
    ],
  },
  "The Omega Protocol (Ultimate)": {
    pf: "One Hello World, one Party Synergy, one Sigma. Name them in the description.",
    steps: [
      "Program loop and pantokrator are the first body checks. Mit is assigned, not improvised.",
      "Party Synergy is a left-right and stack-spread puzzle. Mark the party so the same player is always the same spot.",
      "Hello World is the long mechanic. Use the raidplan the description linked. Do not switch to a second Hello World after a wipe.",
      "Sigma and Omega repeat earlier tells with less time. The enrage is a heal and mit check, so deaths in Sigma are not worth raising.",
    ],
  },
  "Futures Rewritten (Ultimate)": {
    pf: "Lesbin. Each phase has its own line in the description.",
    steps: [
      "Fatebreaker: role tethers, or the fixed-tether variant. Utopia and the conga are called before the pull.",
      "Usurper: Diamond Dust and Light Rampant are a partner-swap plan. Light Rampant players must know their number.",
      "Oracle: Ultimate Relativity is a group-one adjust. Sextuple Apoc is the color or static-spread plan named in the description.",
      "Darklit is a role quadrant with the healer plant. Crystallize Time pops on the early-pop call. Pandora is the last phase and uses the same discipline.",
    ],
  },
  "Dancing Mad (Ultimate)": {
    pf: "Kefkabin.",
    steps: [
      "Phase 1 is the merry-go-round. Phase 2 is the trine pattern, often called as groups of A's and B's.",
      "Phase 3 uses a tank limit break and Kefka-relative black holes. The boss facing is the north of that mechanic.",
      "Phase 4 is Kefka Says. Read the tell, not the previous loop.",
      "Phase 5 is a static Forsaken Null. Stand on the Kefkabin spot for your role.",
    ],
  },
  "The Cloud of Darkness (Chaotic)": {
    pf: "The alliance macro in the party description. This is a 24-player fight.",
    steps: [
      "Confirm which alliance is A, B, and C, and which light party you are in, before you zone in.",
      "Towers, meteors, and flares are alliance jobs. If your alliance is assigned, that is the only job you do.",
      "Do not use a savage-raid clock in a chaotic pull. The macro overrides it.",
    ],
  },
};

function wiki(name) {
  return `https://ffxiv.consolegameswiki.com/wiki/${name.replaceAll(" ", "_").replaceAll("'", "%27")}`;
}

function reddit(name) {
  return `https://www.reddit.com/r/ffxiv/search/?q=${encodeURIComponent(`${name} strat`)}&restrict_sr=1&sort=new`;
}

const plans = targets.map((place) => {
  const chosen = specific[place.name];
  const links = [];
  if (naur[place.name]) links.push({ s: "NAUR", u: naur[place.name] });
  if (place.name.startsWith("AAC ")) links.push({ s: "WTFDIG", u: "https://wtfdig.info/" });
  links.push({ s: "Wiki", u: wiki(place.name) });
  links.push({ s: "Forum", u: reddit(place.name) });
  if (chosen) return { n: place.name, pf: chosen.pf, steps: chosen.steps, links };
  const kind = place.name.includes("Ultimate") ? "ultimate" : place.name.includes("Chaotic") ? "chaotic" : "savage";
  return {
    n: place.name,
    pf: "One written strat for the whole party. The wiki and the newest forum post are the checklist.",
    steps: [
      kind === "ultimate"
        ? "Prog one phase per lockout. A new phase starts only after the previous one is clean."
        : "Resolve the savage version of the normal tells. The snapshots are earlier and the safe spots are smaller.",
      "Towers, pairs, and light-party stacks are positions. If the player for that spot is dead, wipe.",
      "Swap the tank buster and assign raidwide mitigation before the pull, not during the cast.",
      "The enrage wipes the floor. Spend the limit break on the planned mechanic, not on a random recovery.",
    ],
    links,
  };
});

fs.writeFileSync("public/strategies.json", JSON.stringify({ plans }));
console.log(JSON.stringify({ plans: plans.length, specific: plans.filter((plan) => specific[plan.n]).length, bytes: fs.statSync("public/strategies.json").size }));
