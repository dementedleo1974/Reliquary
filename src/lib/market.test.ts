import assert from "node:assert/strict";
import test from "node:test";
import { isWorldOn, knownItemIds, parseBoardPrices, serverFor } from "./market.ts";

test("keeps the lowest unit prices and drops a zero listing", () => {
  const prices = parseBoardPrices(
    {
      items: {
        "13589": { minPrice: 3500, minPriceHQ: 0 },
        "999": { minPrice: 1 },
        "13591": { minPriceNQ: 8000, minPriceHQ: 12000 },
      },
    },
    [13589, 13591],
  );
  assert.deepEqual(prices[13589], { nq: 3500, hq: null });
  assert.deepEqual(prices[13591], { nq: 8000, hq: 12000 });
  assert.equal(prices[999], undefined);
});

test("only accepts catalog item ids", () => {
  assert.deepEqual(knownItemIds([13589, 1, 13589, "13591"]), [13589]);
});

test("a world belongs to its data center", () => {
  assert.equal(serverFor("Gilgamesh"), "Aether");
  assert.equal(serverFor("Aether"), "Aether");
  assert.equal(serverFor("not-a-world"), "Aether");
});

test("a world only belongs to its own server", () => {
  assert.equal(isWorldOn("Aether", "Gilgamesh"), true);
  assert.equal(isWorldOn("Primal", "Gilgamesh"), false);
});

