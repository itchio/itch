import suite from "../test-suite";

import { formatDurationAsMessage, formatDate, DATE_FORMAT } from "./datetime";

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
      formatDate("1994-04-03 11:47:21 +0", "en", DATE_FORMAT),
      "April 3, 1994, 11:47:21"
    );
    t.same(formatDate(21 as any, "en", DATE_FORMAT), "Ø");
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
});
