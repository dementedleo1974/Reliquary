import assert from "node:assert/strict";
import test from "node:test";
import { decodeSaveCode, encodeSaveCode, mergeProgress, readReliquarySave, sanitizeProgressState } from "./progress.ts";

test("save import keeps a real stage and drops unknown keys", () => {
  const save = readReliquarySave(
    JSON.stringify({
      version: 1,
      app: "reliquary",
      selectedLine: "zodiac",
      selectedJob: "pld",
      shared: { "not-an-item": 9, __proto__: { admin: true } },
      weapons: {
        "zodiac:pld": { completed: ["relic", "<script>"], counts: { timeworn: 3, nope: 99 } },
        "zodiac:vpr": { completed: ["relic"], counts: {} },
        "__proto__": { completed: ["relic"], counts: {} },
      },
    }),
  );
  assert.equal(save.selectedLine, "zodiac");
  assert.equal(save.selectedJob, "pld");
  assert.deepEqual(save.shared, {});
  assert.deepEqual(save.weapons["zodiac:pld"]?.completed, ["relic"]);
  assert.equal(save.weapons["zodiac:pld"]?.counts.timeworn, 1);
  assert.equal(save.weapons["zodiac:vpr"], undefined);
  assert.equal(Object.hasOwn(save.weapons, "__proto__"), false);
});

test("rejects a file that is not a Reliquary save", () => {
  assert.throws(() => readReliquarySave("{}"), /not a Reliquary save/);
  assert.throws(() => readReliquarySave("x".repeat(200_001)), /too large/);
});

test("a save code round-trips and still drops unknown keys", async () => {
  const raw = JSON.stringify({
    version: 1,
    app: "reliquary",
    selectedLine: "zodiac",
    selectedJob: "pld",
    shared: {},
    weapons: { "zodiac:pld": { completed: ["relic"], counts: { books: 3, nope: 9 } } },
  });
  const code = await encodeSaveCode(raw);
  assert.match(code, /^RQ(?:B|1)\./);
  const next = readReliquarySave(await decodeSaveCode(code));
  assert.equal(next.weapons["zodiac:pld"]?.counts.books, 3);
  assert.equal(next.weapons["zodiac:pld"]?.counts.nope, undefined);
  await assert.rejects(decodeSaveCode("nope"), /not a Reliquary save code/);
});

test("a restore keeps stages and counts that the file does not mention", () => {
  const merged = mergeProgress(
    {
      selectedLine: "zodiac",
      selectedJob: "pld",
      shared: { timeworn: 1 },
      weapons: {
        "zodiac:pld": { completed: ["relic", "zenith"], counts: { books: 2 } },
        "zodiac:war": { completed: ["relic"], counts: { books: 1 } },
      },
    },
    {
      selectedLine: "anima",
      selectedJob: "drk",
      shared: { timeworn: 3 },
      weapons: {
        "zodiac:pld": { completed: ["relic"], counts: { books: 1, atma: 2 } },
      },
    },
  );
  assert.equal(merged.selectedLine, "anima");
  assert.equal(merged.shared.timeworn, 3);
  assert.deepEqual(merged.weapons["zodiac:pld"]?.completed, ["relic", "zenith"]);
  assert.equal(merged.weapons["zodiac:pld"]?.counts.books, 2);
  assert.equal(merged.weapons["zodiac:pld"]?.counts.atma, 2);
  assert.deepEqual(merged.weapons["zodiac:war"]?.completed, ["relic"]);
});

test("an older deflate save code still restores exactly", async () => {
  const raw = JSON.stringify({
    version: 1,
    app: "reliquary",
    selectedLine: "zodiac",
    selectedJob: "pld",
    shared: {},
    weapons: { "zodiac:pld": { completed: ["relic"], counts: { books: 3 } } },
  });
  const bytes = new TextEncoder().encode(raw);
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  const stream = new Blob([copy]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  const packed = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = "";
  for (let i = 0; i < packed.length; i += 1) binary += String.fromCharCode(packed[i]!);
  const code = `RQ1.${btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "")}`;
  const next = readReliquarySave(await decodeSaveCode(code));
  assert.equal(next.weapons["zodiac:pld"]?.counts.books, 3);
});

test("stored progress cannot switch in an unknown job", () => {
  const next = sanitizeProgressState({ selectedLine: "zodiac", selectedJob: "vpr", shared: {}, weapons: {} });
  assert.equal(next.selectedJob, "pld");
});
