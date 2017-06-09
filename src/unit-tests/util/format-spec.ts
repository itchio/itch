
// tslint:disable:no-shadowed-variable

import test = require("zopf");
import * as format from "../../format";
import {ILocalizer} from "../../localizer";

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
    const localizer = {
      format: (x: any[]) => x,
    } as any as ILocalizer;

    t.same<any>(format.formatDuration(38, localizer), ["duration.minute"]);
    t.same<any>(format.formatDuration(123, localizer), ["duration.minutes", {x: "2"}]);
    t.same<any>(format.formatDuration(3800, localizer), ["duration.hour"]);
    t.same<any>(format.formatDuration(3600 * 4 + 120, localizer), ["duration.hours", {x: "4"}]);
  });

  t.case("date", t => {
    t.same(format.formatDate(new Date("1994-04-03 11:47:21 +0"), "en", format.DATE_FORMAT),
      "April 3, 1994, 11:47:21");
  });

  t.case("price", t => {
    t.same(format.formatPrice("USD", 1500), "$15.00");
    t.same(format.formatPrice("CAD", 60), "CAD $0.60");
    t.same(format.formatPrice("AUD", 75.1), "AUD $0.75");
    t.same(format.formatPrice("GBP", 1000), "£10.00");
    t.same(format.formatPrice("EUR", 2000), "20.00 €");
    t.same(format.formatPrice("JPY", 1500), "¥1500.00");
    t.same(format.formatPrice("BLORGONS", 100), "???");
  });

  t.case("truncate", t => {
    t.same(format.truncate("hello", {length: 10}), "hello");
    t.same(format.truncate("hello my friend this is a Nigerian prince and I", {length: 10}), "hello m...");
  });
});
