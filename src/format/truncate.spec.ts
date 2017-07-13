import suite from "../test-suite";

import { truncate } from "./truncate";

suite(__filename, s => {
  s.case("truncate", t => {
    t.same(truncate("hello", { length: 10 }), "hello");
    t.same(
      truncate("hello my friend this is a Nigerian prince and I", {
        length: 10,
      }),
      "hello m...",
    );
  });
});
