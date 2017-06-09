
// tslint:disable:no-shadowed-variable

import test = require("zopf");
import {createSelector} from "reselect";

test("reselect", t => {
  t.case("memoization prevents recompute for === values", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj.a,
      (a) => { count++; },
    );
    t.same(count, 0);
    let obj = {a: 3};
    sel(obj);
    sel(obj);
    sel({...obj});
    t.same(count, 1);
  });

  t.case("memoization prevents recompute for empty objects", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      (a) => { count++; },
    );
    t.same(count, 0);
    sel({});
    sel({});
    sel({});
    t.same(count, 3);
  });

  t.case("memoization prevents recompute for shallow equal objects", t => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      (a) => { count++; },
    );
    t.same(count, 0);
    let model = {a: 1, b: 2};
    sel({...model});
    sel({...model});
    sel({...model});
    t.same(count, 3);
  });
});
