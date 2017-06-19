
import suite from "../test-suite";
import * as navigation from "./navigation";

import * as bluebird from "bluebird";

suite(__filename, s => {
  s.case("paths", t => {
    let path = "games/3";
    t.same(navigation.pathPrefix(path), "games");
    t.same(navigation.pathToId(path), "3");
    t.same(navigation.pathQuery(path), "");

    path = "games/15827?secret=sauce";
    t.same(navigation.pathPrefix(path), "games");
    t.same(navigation.pathToId(path), "15827");
    t.same(navigation.pathQuery(path), "secret=sauce");

    path = "url/http://itch.io/randomizer?relevant=1";
    t.same(navigation.pathPrefix(path), "url");
    t.same(navigation.pathToId(path), "http://itch.io/randomizer");
    t.same(navigation.pathQuery(path), "relevant=1");

    path = "invalid";
    t.same(navigation.pathPrefix(path), "");
    t.same(navigation.pathToId(path), "");
    t.same(navigation.pathQuery(path), "");

    path = "";
    t.same(navigation.pathPrefix(path), "");
    t.same(navigation.pathToId(path), "");
    t.same(navigation.pathQuery(path), "");
  });

  s.case("transformUrl", async t => {
    t.same(await navigation.transformUrl("https://itch.io", name => bluebird.resolve("")), "https://itch.io");
    t.same(await navigation.transformUrl("http://localhost.com:8080/randomizer", name => bluebird.resolve("")),
      "http://localhost.com:8080/randomizer");
    t.same(await navigation.transformUrl("kermit plushie", name => {
      const e = new Error() as NodeJS.ErrnoException;
      e.code = "ENOTFOUND";
      return bluebird.reject(e);
    }),
      "https://duckduckgo.com/?q=kermit%20plushie&kae=d");
  });
});
