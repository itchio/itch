import suite from "../test-suite";
import * as navigation from "./navigation";

suite(__filename, s => {
  s.case("transformUrl", async t => {
    t.same(navigation.transformUrl("about:blank"), "about:blank");
    t.same(navigation.transformUrl("https://itch.io"), "https://itch.io");
    t.same(navigation.transformUrl("itch.io"), "http://itch.io");
    t.same(
      navigation.transformUrl("http://localhost.com:8080/randomizer"),
      "http://localhost.com:8080/randomizer"
    );
    t.same(
      navigation.transformUrl("kermit plushie"),
      "https://duckduckgo.com/?q=kermit%20plushie&kae=d"
    );
    t.same(
      navigation.transformUrl("?kermit"),
      "https://duckduckgo.com/?q=kermit&kae=d"
    );
    t.same(navigation.transformUrl(""), "https://duckduckgo.com/?q=&kae=d");
  });
});
