import suite from "../test-suite";

import { toDateTimeField, fromDateTimeField } from "./datetime-field";

suite(__filename, s => {
  const iso8epoch = "1970-01-01T00:00:00.000Z";
  const rfc3epoch = "1970-01-01 00:00:00";
  s.case("fromDateTimeField", t => {
    t.same(fromDateTimeField(0), new Date(0));
    t.same(fromDateTimeField(rfc3epoch), new Date(0));
    t.same(fromDateTimeField(iso8epoch), new Date(0));
    t.same(fromDateTimeField(null), null);
    t.same(fromDateTimeField(undefined), null);
  });
  s.case("toDateTimeField", t => {
    t.same(toDateTimeField(new Date(0)), iso8epoch);
    t.same(toDateTimeField(0), iso8epoch);
    t.same(toDateTimeField(iso8epoch), iso8epoch);
    t.same(toDateTimeField(rfc3epoch), iso8epoch);
    t.same(toDateTimeField(null), null);
    t.same(toDateTimeField(undefined), null);
  });
});
