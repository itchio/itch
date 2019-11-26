import { describe, it, assert } from "test";
import getByIds from "common/helpers/get-by-ids";

describe("get-by-ids", () => {
  it("gets records by IDs, being chill about null values", () => {
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

    assert.deepEqual(getByIds(null, []), []);
    assert.deepEqual(getByIds(records, null), []);
    assert.deepEqual(getByIds(records, []), []);
    assert.deepEqual(getByIds(records, ["34"]), [{ word: "thirty-four" }]);
    assert.deepEqual(getByIds(records, ["56", "1024", "12"]), [
      { word: "fifty-six" },
      { word: "twelve" },
    ]);
  });
});
