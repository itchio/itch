import suite from "../test-suite";
import getByIds from "./get-by-ids";

suite(__filename, s => {
  s.case("gets records by IDs, being chill about null values", t => {
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
    t.same(getByIds(records, ["34"]), [{ word: "thirty-four" }]);
    t.same(getByIds(records, ["56", "1024", "12"]), [
      { word: "fifty-six" },
      { word: "twelve" },
    ]);
  });
});
