
import * as test from "zopf";

import getByIds from "./get-by-ids";

test(__filename, T => {
  T.case("getByIds", async t => {
    const records = {
      "12": {
        word: "twelve",
      },
      "34": {
        word: "thirty-four",
      },
      "56": {
        word: "fifty-six",
      },
    };

    t.same(getByIds(null, []), []);
    t.same(getByIds(records, null), []);
    t.same(getByIds(records, []), []);
  });
});
