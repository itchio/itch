import { describe, it, assert } from "test";

import { formatPrice } from "common/format/price";

describe("price", () => {
  it("price", () => {
    assert.equal(formatPrice("USD", 1500), "$15.00");
    assert.equal(formatPrice("CAD", 60), "CAD $0.60");
    assert.equal(formatPrice("AUD", 75.1), "AUD $0.75");
    assert.equal(formatPrice("GBP", 1000), "£10.00");
    assert.equal(formatPrice("EUR", 2000), "20.00 €");
    assert.equal(formatPrice("JPY", 1500), "¥1500.00");
    assert.equal(formatPrice("BLORGONS", 100), "$1.00");
  });
});
