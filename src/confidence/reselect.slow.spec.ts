import suite from "../test-suite";

import { createSelector } from "reselect";

suite(__filename, s => {
  s.case("memoization prevents recompute for === values", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj.a,
      a => {
        count++;
      },
    );
    t.same(count, 0);
    let obj = { a: 3 };
    sel(obj);
    sel(obj);
    sel({ ...obj });
    t.same(count, 1);
  });

  s.case("memoization prevents recompute for empty objects", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      a => {
        count++;
      },
    );
    t.same(count, 0);
    sel({});
    sel({});
    sel({});
    t.same(count, 3);
  });

  s.case("memoization prevents recompute for shallow equal objects", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      a => {
        count++;
      },
    );
    t.same(count, 0);
    let model = { a: 1, b: 2 };
    sel({ ...model });
    sel({ ...model });
    sel({ ...model });
    t.same(count, 3);
  });

  s.case(
    "memoization prevents recompute when input selectors results are ===",
    t => {
      let count = 0;
      const sel = createSelector(
        (obj: any) => obj.i18n,
        (obj: any) => obj.session.credentials,
        a => {
          count++;
        },
      );
      t.same(count, 0);
      let model = { i18n: {}, session: { credentials: {} }, somethingElse: 2 };
      sel(model);
      model = { ...model, somethingElse: 5 };
      sel(model);
      model = { ...model, somethingElse: 9 };
      t.same(count, 1);
    },
  );
});
