import suite from "../test-suite";

import { slugify } from "./slugify";

suite(__filename, s => {
  s.case("slugify", t => {
    t.same(slugify("One step, two step"), "one_step_two_step");
    t.same(slugify("one-step-two-step"), "onesteptwostep");
    t.same(slugify("there we          go"), "there_we_go");
  });
});
