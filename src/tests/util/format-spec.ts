
// tslint:disable:no-shadowed-variable

import test = require("zopf");
import format from "../../util/format";

test("format", t => {
  t.case("camelify", t => {
    t.same(format.camelify("underscore"), "underscore");
    t.same(format.camelify("under score"), "under score");
    t.same(format.camelify("under_score"), "underScore");
    t.same(format.camelify("heed_the_call"), "heedTheCall");
    t.same(format.camelify("_sorry"), "Sorry");
  });

  t.case("camelifyObject", t => {
    t.same(format.camelifyObject({
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

  t.case("seconds", t => {
    t.same(format.seconds(38), ["duration.minute"]);
    t.same(format.seconds(123), ["duration.minutes", {x: "2"}]);
    t.same(format.seconds(3800), ["duration.hour"]);
    t.same(format.seconds(3600 * 4 + 120), ["duration.hours", {x: "4"}]);
  });

  t.case("date", t => {
    t.same(format.date(Date.parse("1994-04-03T11:47:21"), "DD MMMM, YYYY", "en"), "03 April, 1994");
  });

  t.case("price", t => {
    t.same(format.price("USD", 1500), "$15.00");
    t.same(format.price("CAD", 60), "CAD $0.60");
    t.same(format.price("AUD", 75.1), "AUD $0.75");
    t.same(format.price("GBP", 1000), "£10.00");
    t.same(format.price("EUR", 2000), "20.00 €");
    t.same(format.price("JPY", 1500), "¥1500.00");
    t.same(format.price("BLORGONS", 100), "???");
  });

  t.case("truncate", t => {
    t.same(format.truncate("hello", {length: 10}), "hello");
    t.same(format.truncate("hello my friend this is a Nigerian prince and I", {length: 10}), "hello m...");
  });
});
