export function parseInventory(csv) {
  return csv.trim().split("\n").slice(1).map((line) => {
    const [sku, quantityText] = line.split(",");
    if (!sku) throw new Error("SKU is required");
    const quantity = Number(quantityText);
    if (!Number.isInteger(quantity) || quantity < 0) throw new Error("Invalid quantity");
    return { sku, quantity };
  });
}
