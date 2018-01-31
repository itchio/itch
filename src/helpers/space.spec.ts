import suite from "../test-suite";
import { Space } from "./space";
import { ITabInstance } from "../types/index";

suite(__filename, s => {
  const makeInstance = (url?, resource?) =>
    ({
      history: [{ url, resource }],
      currentIndex: 0,
    } as ITabInstance);

  s.case("internal pages", t => {
    // FIXME: fill up

    let sp = Space.fromInstance(makeInstance("itch://games/3"));
    t.same(sp.internalPage(), "games");
    t.same(sp.firstPathElement(), "3");
    t.same(sp.firstPathNumber(), 3);
  });
});
