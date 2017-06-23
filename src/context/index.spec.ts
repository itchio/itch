import suite from "../test-suite";
import Context from ".";
import * as bluebird from "bluebird";

import { DB } from "../db";
import { IStore, Cancelled } from "../types";

const db = {} as DB;
const store = {} as IStore;

suite(__filename, s => {
  s.case("Context propagates progress", async t => {
    const c = new Context(store, db);

    let p1 = 0;
    let p2 = 0;
    c.on("progress", info => {
      p1 = info.progress;
    });
    c.on("progress", info => {
      p2 = info.progress;
    });

    t.same(p1, 0, "progress1 is 0 still");
    t.same(p2, 0, "progress2 is 0 still");

    c.emitProgress({ progress: 0.5 });

    t.same(p1, 0.5, "progress1 is now 0.5");
    t.same(p2, 0.5, "progress2 is now 0.5");
  });

  s.case("Context returns result", async t => {
    const c = new Context(store, db);

    const ret = await (async () => {
      return c.withStopper({
        stop: async () => null,
        work: async () => 42,
      });
    })();

    t.same(ret, 42, "result was returned");
  });

  s.case("Context signals abort", async t => {
    const c = new Context(store, db);

    let abortCount = 0;
    let allowAbort = false;

    c.on("abort", () => {
      abortCount++;
    });

    t.is(abortCount, 0, "haven't aborted initially");

    let ranFirstTask = false;
    let cancelledFirstTask = false;
    let p1 = c
      .withStopper({
        stop: async () => {
          if (!allowAbort) {
            throw new Error("cannot cancel");
          }
        },
        work: async () => {
          ranFirstTask = true;
          while (!c.isDead()) {
            await bluebird.delay(100);
          }
        },
      })
      .catch(e => {
        if (e instanceof Cancelled) {
          cancelledFirstTask = true;
        } else {
          throw e;
        }
      });

    await t.rejects(c.tryAbort());
    t.same(abortCount, 0, "haven't aborted yet");
    t.true(ranFirstTask, "first task was run");
    t.false(cancelledFirstTask, "first task was not cancelled yet");

    allowAbort = true;
    await c.tryAbort();
    t.same(abortCount, 1, "we aborted once");
    await p1;
    t.true(cancelledFirstTask, "first task was cancelled now");

    let ranSecondTask = false;
    let cancelledSecondTask = false;
    let p2 = c
      .withStopper({
        stop: async () => null,
        work: () => {
          ranSecondTask = true;
          return Promise.resolve();
        },
      })
      .catch(e => {
        if (e instanceof Cancelled) {
          cancelledSecondTask = true;
        } else {
          throw e;
        }
      });

    t.false(ranSecondTask, "second task was not ran");
    await p2;
    t.true(cancelledSecondTask, "second task was cancelled");

    await c.tryAbort();
    t.same(abortCount, 1, "we aborted only once throughout");
  });
});
