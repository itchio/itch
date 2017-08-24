import suite from "../test-suite";

import { fromJSONField, toJSONField } from "./json-field";

suite(__filename, s => {
  const input = {
    string: "string",
    object: {
      inner: 42,
    },
    date: "1970-01-02T00:00:00.000Z",
  };
  const invalidJson = `{`;
  const notString = 43 as any;
  const empty = "";
  const jsonNull = "null";
  const fallback = { a: "b" };
  s.case("fromJSONField", t => {
    t.same(fromJSONField(null), null);
    t.same(fromJSONField(invalidJson), null);
    t.same(fromJSONField(notString), null);
    t.same(fromJSONField(empty), null);
    t.same(fromJSONField(jsonNull), null);

    t.same(fromJSONField(null, fallback), fallback);
    t.same(fromJSONField(invalidJson, fallback), fallback);
    t.same(fromJSONField(notString, fallback), fallback);
    t.same(fromJSONField(empty, fallback), fallback);
    t.same(fromJSONField(jsonNull, fallback), fallback);
  });
  s.case("toDateTimeField", t => {
    t.same(toJSONField([]), JSON.stringify([]));
    t.same(toJSONField(0), JSON.stringify(0));
    t.same(toJSONField(null), null);
    t.same(toJSONField(undefined), null);
    t.same(toJSONField({ a: "b" }), JSON.stringify({ a: "b" }));
    t.same(JSON.parse(toJSONField(input)), input);
  });
});
