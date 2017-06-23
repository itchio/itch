import suite from "../test-suite";

import { formatPrice } from "./price";

suite(__filename, s => {
  s.case("price", t => {
    t.same(formatPrice("USD", 1500), "$15.00");
    t.same(formatPrice("CAD", 60), "CAD $0.60");
    t.same(formatPrice("AUD", 75.1), "AUD $0.75");
    t.same(formatPrice("GBP", 1000), "£10.00");
    t.same(formatPrice("EUR", 2000), "20.00 €");
    t.same(formatPrice("JPY", 1500), "¥1500.00");
    t.same(formatPrice("BLORGONS", 100), "???");
  });
});
