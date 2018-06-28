import { describe, it, assert } from "test";

import { truncate } from "./truncate";

describe("truncate", () => {
  it("truncate", () => {
    assert.equal(truncate("hello", { length: 10 }), "hello");
    assert.equal(truncate(null, { length: 10 }), null);
    assert.equal(
      truncate("hello my friend this is a Nigerian prince and I", {
        length: 10,
      }),
      "hello m..."
    );
  });
});
