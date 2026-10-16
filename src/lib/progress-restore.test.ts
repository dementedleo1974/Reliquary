import assert from "node:assert/strict";
import test from "node:test";
import { decodeSaveCode, encodeSaveCode, readReliquarySave, sanitizeProgressState } from "./progress.ts";

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
  assert.match(code, /^RQ1\./);
  const next = readReliquarySave(await decodeSaveCode(code));
  assert.equal(next.weapons["zodiac:pld"]?.counts.books, 3);
  assert.equal(next.weapons["zodiac:pld"]?.counts.nope, undefined);
  await assert.rejects(decodeSaveCode("nope"), /not a Reliquary save code/);
});

test("stored progress cannot switch in an unknown job", () => {
  const next = sanitizeProgressState({ selectedLine: "zodiac", selectedJob: "vpr", shared: {}, weapons: {} });
  assert.equal(next.selectedJob, "pld");
});
