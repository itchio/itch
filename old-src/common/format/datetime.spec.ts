import { describe, it, assert } from "test";

import {
  formatDurationAsMessage,
  formatDate,
  getFormatter,
  DATE_FORMAT,
} from "common/format/datetime";

describe("datetime", () => {
  it("seconds", () => {
    assert.deepEqual(formatDurationAsMessage(38), {
      id: "duration.seconds",
      values: { x: "38" },
    });
    assert.deepEqual(formatDurationAsMessage(123), {
      id: "duration.minutes",
      values: { x: "2" },
    });
    assert.deepEqual(formatDurationAsMessage(3800), { id: "duration.hour" });
    assert.deepEqual(formatDurationAsMessage(3600 * 4 + 120), {
      id: "duration.hours",
      values: { x: "4" },
    });
  });

  it("formatDate", () => {
    const refString = "April 3, 1994, 11:47:21";

    assert.equal(formatDate(null, "en", DATE_FORMAT), "");
    assert.equal(formatDate(new Date("haha"), "en", DATE_FORMAT), "Ø");
    assert.equal(
      formatDate(new Date("1994-04-03 11:47:21 +0"), "en", DATE_FORMAT),
      refString
    );
    assert.equal(
      formatDate(new Date("1994-04-03 11:47:21 +0"), "en-US", DATE_FORMAT),
      refString
    );
  });

  it("getFormatter", () => {
    const f1 = getFormatter(DATE_FORMAT, "en-US");
    const f2 = getFormatter(DATE_FORMAT, "en-US");
    assert.strictEqual(f1, f2, "should re-use cached formatter");
  });
});
