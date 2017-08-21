import suite from "../test-suite";
import { Space } from "./space";

suite(__filename, s => {
  s.case("paths", t => {
    let sp = new Space({ path: "games/3" });
    t.same(sp.prefix, "games");
    t.same(sp.suffix, "3");
    t.same(sp.numericId(), 3);

    sp = new Space({ path: "url/http://itch.io/randomizer?relevant=1" });
    t.same(sp.prefix, "url");
    t.same(sp.suffix, "http://itch.io/randomizer?relevant=1");

    sp = new Space({ path: "invalid" });
    t.same(sp.prefix, "invalid");
    t.same(sp.suffix, undefined);
  });
});
