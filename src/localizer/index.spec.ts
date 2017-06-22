
import suite from "../test-suite";
import {getT} from ".";

const strings = {
  fr: {
    bar: "Café {{somekey}} pub.",
  },
  en: {
    foo: "Foo!",
    bar: "Bar {{somekey}} bar.",
  },
};

suite(__filename, s => {
  const lt = getT(strings, "en");
  const ltLong = getT(strings, "en-US");
  const lfrt = getT(strings, "fr");

  s.case("null", t => {
    t.same(lt(null), null);
  });

  s.case("trivial", t => {
    t.same(lt("foo"), "Foo!");
    t.same(ltLong("foo"), "Foo!");
  });

  s.case("with variables", t => {
    t.same(lt("bar", {somekey: "hello"}), "Bar hello bar.");
  });

  s.case("with defaultValue fallback", t => {
    t.same(lt("lapis", {somekey: "hello", defaultValue: "kinkos"}), "kinkos");
  });

  s.case("with key fallback", t => {
    t.same(lt(["bar", "foo"], {somekey: "hello"}), "Bar hello bar.");
    t.same(lt(["baz", "bar"], {somekey: "hello"}), "Bar hello bar.");
  });

  s.case("with lang fallback", t => {
    t.same(lfrt("bar", {somekey: "salut"}), "Café salut pub.");
    t.same(lfrt("foo"), "Foo!");
  });

  s.case("format", t => {
    t.same(lt.format("Park life"), "Park life");
    t.same(lt.format(["bar", {somekey: "hello"}]), "Bar hello bar.");
  });

  s.case("with default values", t => {
    t.same(lt("Park life"), "Park life");
    t.same(lt("Park life", {a: "b"}), "Park life {\"a\":\"b\"}");
  });
});
