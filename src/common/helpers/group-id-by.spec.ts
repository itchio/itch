import { describe, it, assert } from "test";

import groupIdBy from "common/helpers/group-id-by";
import { indexBy } from "underscore";

describe("group-id-by", () => {
  it("groupIdBy", () => {
    assert.deepEqual(groupIdBy(null, "gameId"), {});
    assert.deepEqual(groupIdBy(undefined, "gameId"), {});
    assert.deepEqual(groupIdBy([], "gameId"), {});
    assert.deepEqual(groupIdBy({}, "gameId"), {});

    const items = [
      { id: 1, gameId: 11 },
      { id: 4, gameId: 44 },
      { id: 7, gameId: 77 },
      { id: 77, gameId: 77 },
    ];

    assert.deepEqual(groupIdBy(items, "gameId"), {
      11: [1],
      44: [4],
      77: [7, 77],
    } as any);

    assert.deepEqual(
      groupIdBy<typeof items[0]>(items, (o) => String(o.gameId * 10)),
      {
        110: [1],
        440: [4],
        770: [7, 77],
      } as any
    );

    assert.deepEqual(groupIdBy(items, "id"), {
      1: [1],
      4: [4],
      7: [7],
      77: [77],
    } as any);

    const itemMap = indexBy(items, "id");

    assert.deepEqual(groupIdBy(itemMap, "gameId"), {
      11: [1],
      44: [4],
      77: [7, 77],
    } as any);

    assert.deepEqual(groupIdBy(itemMap, "id"), {
      1: [1],
      4: [4],
      7: [7],
      77: [77],
    } as any);
  });
});
