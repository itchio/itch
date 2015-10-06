import assert from "assert";
import remote from "remote";
let app = remote.require("app");

describe("itch.io base", () => {
  describe("app.getName()", () => {
    it("returns the correct app name", () => {
      assert.equal(app.getName(), "itch.io");
    });
  });
});

