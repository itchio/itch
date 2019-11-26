import { describe, it, assert } from "test";

import { slugify } from "common/format/slugify";

describe("slugify", () => {
  it("slugify", () => {
    assert.equal(slugify("One step, two step"), "one_step_two_step");
    assert.equal(slugify("one-step-two-step"), "onesteptwostep");
    assert.equal(slugify("there we          go"), "there_we_go");
  });
});
