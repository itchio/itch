
import suite from "../../test-suite";

import {
  getActiveDownload, getPendingDownloads, getPendingForGame
} from "./getters";

suite(__filename, s => {
  const noDownloads: any = {};
  const oneInactive: any = {
    "disco": {
      order: 1,
      game: {id: 11},
      finished: true,
    },
  };
  const oneActive: any = {
    "disco": {
      order: 21,
      game: {id: 2121},
    },
  };
  const activeAndInactive: any = {
    "disco": {
      order: 1,
      game: {id: 11},
      finished: true,
    },
    "punk": {
      order: 7,
      game: {id: 77},
      finished: true,
    },
    "rock": {
      order: 2,
      game: {id: 22},
    },
  };

  s.case("getPendingDownloads", t => {
    t.same(getPendingDownloads({items: noDownloads} as any), []);
    t.same(getPendingDownloads({items: oneInactive} as any), []);
    t.same(getPendingDownloads({items: oneActive} as any), [oneActive.disco]);
    t.same(getPendingDownloads({items: activeAndInactive} as any), [activeAndInactive.rock]);
  });

  s.case("getActiveDownload", t => {
    t.false(getActiveDownload({items: noDownloads} as any));
    t.false(getActiveDownload({items: oneInactive} as any));
    t.same(getActiveDownload({items: oneActive} as any), oneActive.disco);
    t.same(getActiveDownload({items: activeAndInactive} as any), activeAndInactive.rock);
  });

  s.case("getPendingForGame", t => {
    t.same(getPendingForGame({items: noDownloads} as any, 2121), []);
    t.same(getPendingForGame({items: oneInactive} as any, 11), []);
    t.same(getPendingForGame({items: oneActive} as any, 11), []);
    t.same(getPendingForGame({items: oneActive} as any, 2121), [oneActive.disco]);
    t.same(getPendingForGame({items: activeAndInactive} as any, 11), []);
    t.same(getPendingForGame({items: activeAndInactive} as any, 22), [activeAndInactive.rock]);
  });
});
