
// tslint:disable:no-shadowed-variable

import test = require("zopf");

import * as navigation from "../../util/navigation";

test("navigation utils", t => {
  t.case("paths", t => {
    const path = "games/1234?secret=32";

    t.same(navigation.pathToId(path), "1234");
    t.same(navigation.pathPrefix(path), "games");
  });
});
