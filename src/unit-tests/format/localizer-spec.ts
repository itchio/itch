
// tslint:disable:no-shadowed-variable

import test = require("zopf");
import {getT, disableIdentity} from "../../localizer";

disableIdentity();

const strings = {
  fr: {
    bar: "Café {{somekey}} pub.",
  },
  en: {
    foo: "Foo!",
    bar: "Bar {{somekey}} bar.",
  },
};

test("localizer", t => {
  const lt = getT(strings, "en");
  const lfrt = getT(strings, "fr");

  t.case("trivial", t => {
    t.same(lt("foo"), "Foo!");
  });

  t.case("with variables", t => {
    t.same(lt("bar", {somekey: "hello"}), "Bar hello bar.");
  });

  t.case("with defaultValue fallback", t => {
    t.same(lt("lapis", {somekey: "hello", defaultValue: "kinkos"}), "kinkos");
  });

  t.case("with key fallback", t => {
    t.same(lt(["bar", "foo"], {somekey: "hello"}), "Bar hello bar.");
    t.same(lt(["baz", "bar"], {somekey: "hello"}), "Bar hello bar.");
  });

  t.case("with lang fallback", t => {
    t.same(lfrt("bar", {somekey: "salut"}), "Café salut pub.");
    t.same(lfrt("foo"), "Foo!");
  });

  t.case("format", t => {
    t.same(lt.format("Park life"), "Park life");
    t.same(lt.format(["bar", {somekey: "hello"}]), "Bar hello bar.");
  });
});
