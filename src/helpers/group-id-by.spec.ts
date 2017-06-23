import suite from "../test-suite";

import groupIdBy from "./group-id-by";
import { indexBy } from "underscore";

suite(__filename, s => {
  s.case("groupIdBy", t => {
    t.same(groupIdBy(null, "gameId"), {});
    t.same(groupIdBy(undefined, "gameId"), {});
    t.same(groupIdBy([], "gameId"), {});
    t.same(groupIdBy({}, "gameId"), {});

    const items = [
      { id: 1, gameId: 11 },
      { id: 4, gameId: 44 },
      { id: 7, gameId: 77 },
      { id: 77, gameId: 77 },
    ];

    t.same(
      groupIdBy(items, "gameId"),
      {
        11: [1],
        44: [4],
        77: [7, 77],
      } as any,
    );

    t.same(
      groupIdBy(items, "id"),
      {
        1: [1],
        4: [4],
        7: [7],
        77: [77],
      } as any,
    );

    const itemMap = indexBy(items, "id");

    t.same(
      groupIdBy(itemMap, "gameId"),
      {
        11: [1],
        44: [4],
        77: [7, 77],
      } as any,
    );

    t.same(
      groupIdBy(itemMap, "id"),
      {
        1: [1],
        4: [4],
        7: [7],
        77: [77],
      } as any,
    );
  });
});
