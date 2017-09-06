import suite from "../test-suite";

import {
  formatDurationAsMessage,
  formatDate,
  getFormatter,
  DATE_FORMAT,
} from "./datetime";
import { fromDateTimeField } from "../db/datetime-field";

suite(__filename, s => {
  s.case("seconds", t => {
    t.same(formatDurationAsMessage(38), { id: "duration.minute" });
    t.same(formatDurationAsMessage(123), {
      id: "duration.minutes",
      values: { x: "2" },
    });
    t.same(formatDurationAsMessage(3800), { id: "duration.hour" });
    t.same(formatDurationAsMessage(3600 * 4 + 120), {
      id: "duration.hours",
      values: { x: "4" },
    });
  });

  s.case("formatDate", t => {
    const refString = "April 3, 1994, 11:47:21";

    t.same(formatDate(null, "en", DATE_FORMAT), "");
    t.same(
      formatDate(
        fromDateTimeField("1994-04-03 11:47:21 +0"),
        "en",
        DATE_FORMAT
      ),
      "April 3, 1994, 11:47:21"
    );
    t.same(formatDate(new Date("haha"), "en", DATE_FORMAT), "Ø");
    t.same(
      formatDate(new Date("1994-04-03 11:47:21 +0"), "en", DATE_FORMAT),
      refString
    );
    t.same(
      formatDate(new Date("1994-04-03 11:47:21 +0"), "en-US", DATE_FORMAT),
      refString
    );
  });

  s.case("getFormatter", t => {
    const f1 = getFormatter(DATE_FORMAT, "en-US");
    const f2 = getFormatter(DATE_FORMAT, "en-US");
    t.is(f1, f2, "should re-use cached formatter");
  });
});
