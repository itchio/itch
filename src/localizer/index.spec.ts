
import suite from "../test-suite";
import {getT, disableIdentity} from ".";

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

suite(__filename, s => {
  const lt = getT(strings, "en");
  const lfrt = getT(strings, "fr");

  s.case("trivial", t => {
    t.same(lt("foo"), "Foo!");
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
});
