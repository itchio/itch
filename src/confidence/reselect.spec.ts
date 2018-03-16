import { describe, it, assert } from "../test";

import { createSelector } from "reselect";

describe("reselect", () => {
  it("memoization prevents recompute for === values", () => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj.a,
      a => {
        count++;
      }
    );
    assert.equal(count, 0);
    let obj = { a: 3 };
    sel(obj);
    sel(obj);
    sel({ ...obj });
    assert.equal(count, 1);
  });

  it("memoization prevents recompute for empty objects", () => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      a => {
        count++;
      }
    );
    assert.equal(count, 0);
    sel({});
    sel({});
    sel({});
    assert.equal(count, 3);
  });

  it("memoization prevents recompute for shallow equal objects", () => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj,
      a => {
        count++;
      }
    );
    assert.equal(count, 0);
    let model = { a: 1, b: 2 };
    sel({ ...model });
    sel({ ...model });
    sel({ ...model });
    assert.equal(count, 3);
  });

  it("memoization prevents recompute when input selectors results are ===", () => {
    let count = 0;
    const sel = createSelector(
      (obj: any) => obj.i18n,
      (obj: any) => obj.session.credentials,
      a => {
        count++;
      }
    );
    assert.equal(count, 0);
    let model = { i18n: {}, session: { credentials: {} }, somethingElse: 2 };
    sel(model);
    model = { ...model, somethingElse: 5 };
    sel(model);
    model = { ...model, somethingElse: 9 };
    assert.equal(count, 1);
  });
});
