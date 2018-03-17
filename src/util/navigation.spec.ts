import { describe, it, assert } from "../test";
import * as navigation from "./navigation";

describe("navigation", () => {
  it("transformUrl", () => {
    assert.equal(navigation.transformUrl("about:blank"), "about:blank");
    assert.equal(navigation.transformUrl("https://itch.io"), "https://itch.io");
    assert.equal(navigation.transformUrl("itch.io"), "http://itch.io");
    assert.equal(
      navigation.transformUrl("http://localhost.com:8080/randomizer"),
      "http://localhost.com:8080/randomizer"
    );
    assert.equal(
      navigation.transformUrl("kermit plushie"),
      "https://duckduckgo.com/?q=kermit%20plushie&kae=d"
    );
    assert.equal(
      navigation.transformUrl("?kermit"),
      "https://duckduckgo.com/?q=kermit&kae=d"
    );
    assert.equal(
      navigation.transformUrl(""),
      "https://duckduckgo.com/?q=&kae=d"
    );
  });
});
