
import suite from "../../test-suite";
import {sortBy} from "underscore";

import {
  getActiveDownload, getPendingDownloads, getPendingForGame, excludeGame,
  getFinishedDownloads,
} from "./getters";

suite(__filename, s => {
  const noDownloads = {};
  const oneInactive = {
    "disco": {
      order: 1,
      game: {id: 11},
      finished: true,
    },
  };
  const oneActive = {
    "disco": {
      order: 21,
      game: {id: 2121},
    },
  };
  const activeAndInactive = {
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

  s.case("excludeGame", t => {
    let sameItems = (a, b) => {
      t.same(sortBy(a, "order"), sortBy(b, "order"));
    };
    sameItems(excludeGame({items: noDownloads} as any, 11), []);
    sameItems(excludeGame({items: activeAndInactive} as any, -120),
      [activeAndInactive.rock, activeAndInactive.disco, activeAndInactive.punk]);
    sameItems(excludeGame({items: activeAndInactive} as any, 11),
      [activeAndInactive.rock, activeAndInactive.punk]);
  });

  const withFinished = {
    a: {
      game: {id: 11},
      order: 111,
      finished: true,
      finishedAt: 2345,
    },
    b: {
      game: {id: 33},
      order: 333,
    },
    c: {
      game: {id: 55},
      order: 777,
      finished: true,
      finishedAt: 1234,
    },
    d: {
      game: {id: 77},
      order: 555,
    },
  };

  s.case("getFinishedDownloads", t => {
    t.same(getFinishedDownloads({items: withFinished} as any),
      [withFinished.a, withFinished.c] as any);

    t.same(getPendingDownloads({items: withFinished} as any),
      [withFinished.b, withFinished.d] as any);
  });
});
