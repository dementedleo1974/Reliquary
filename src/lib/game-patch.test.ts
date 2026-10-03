import assert from "node:assert/strict";
import test from "node:test";
import { parseLivePatch } from "./game-patch.ts";

test("picks the highest public patch and ignores hotfixes", () => {
  const patch = parseLivePatch({
    versions: [
      { names: ["7.0"] },
      { names: ["7.56", "7.56x1"] },
      { names: ["latest"] },
      { names: ["7.55"] },
    ],
  });
  assert.equal(patch, "7.56");
});

test("rejects unexpected shapes", () => {
  assert.equal(parseLivePatch(null), null);
  assert.equal(parseLivePatch({ versions: "7.56" }), null);
  assert.equal(parseLivePatch({ versions: [{ names: ["<script>"] }] }), null);
  assert.equal(parseLivePatch({ versions: [{ names: ["../7.56"] }] }), null);
});
