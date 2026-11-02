import test from "node:test";
import assert from "node:assert/strict";
import { parseInventory } from "./inventory.mjs";
test("imports a valid inventory row", () => {
  assert.deepEqual(parseInventory("sku,quantity\nCOFFEE-01,8"), [{sku:"COFFEE-01",quantity:8}]);
});
test("rejects a whitespace-only SKU", () => {
  assert.throws(() => parseInventory("sku,quantity\n   ,8"), /SKU is required/);
});
test("normalizes surrounding SKU whitespace", () => {
  assert.deepEqual(parseInventory("sku,quantity\n COFFEE-01 ,8"), [{sku:"COFFEE-01",quantity:8}]);
});
test("rejects negative quantities", () => {
  assert.throws(() => parseInventory("sku,quantity\nCOFFEE-01,-1"), /Invalid quantity/);
});
