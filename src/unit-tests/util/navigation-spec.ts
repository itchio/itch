
// tslint:disable:no-shadowed-variable

import test = require("zopf");

import * as navigation from "../../util/navigation";

test("navigation utils", t => {
  t.case("paths", t => {
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
});
