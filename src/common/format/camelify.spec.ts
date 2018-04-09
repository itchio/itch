import { describe, it, assert } from "test";

import { camelify, camelifyObject } from "./camelify";

describe("camelify", () => {
  it("camelify", () => {
    assert.equal(camelify("underscore"), "underscore");
    assert.equal(camelify("under score"), "under score");
    assert.equal(camelify("under_score"), "underScore");
    assert.equal(camelify("heed_the_call"), "heedTheCall");
    assert.equal(camelify("_sorry"), "Sorry");
  });

  it("camelifyObject", () => {
    assert.deepEqual(
      camelifyObject({
        heed: 12,
        the_call: {
          display_name: "waffles",
        },
        alreadyDone: ["dont_touch_me"],
      }),
      {
        heed: 12,
        theCall: {
          displayName: "waffles",
        },
        alreadyDone: ["dont_touch_me"],
      }
    );

    const date = new Date();
    assert.deepEqual(camelifyObject({ created_at: date }), {
      createdAt: date,
    });
  });
});
