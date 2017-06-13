
import suite from "../test-suite";

import {camelify, camelifyObject} from "./camelify";

suite(__filename, s => {
  s.case("camelify", t => {
    t.same(camelify("underscore"), "underscore");
    t.same(camelify("under score"), "under score");
    t.same(camelify("under_score"), "underScore");
    t.same(camelify("heed_the_call"), "heedTheCall");
    t.same(camelify("_sorry"), "Sorry");
  });

  s.case("camelifyObject", t => {
    t.same(camelifyObject({
      heed: 12,
      the_call: {
        display_name: "waffles",
      },
      alreadyDone: [ "dont_touch_me" ],
    }), {
      heed: 12,
      theCall: {
        displayName: "waffles",
      },
      alreadyDone: [ "dont_touch_me" ],
    });
  });
});
