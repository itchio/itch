import suite from "../test-suite";
import Context from "./index";

import { IStore, isCancelled } from "../types";

const store = {} as IStore;

suite(__filename, s => {
  s.case("Context propagates progress", async t => {
    const c = new Context(store);

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
    const c = new Context(store);

    const ret = await (async () => {
      return c.withStopper({
        stop: async () => null,
        work: async () => 42,
      });
    })();

    t.same(ret, 42, "result was returned");
  });

  s.case("Context signals abort", async t => {
    const c = new Context(store);

    let abortCount = 0;
    let allowAbort = false;

    c.on("abort", () => {
      abortCount++;
    });

    t.is(abortCount, 0, "haven't aborted initially");
    t.false(c.isDead(), "context is not dead yet");

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
          await new Promise(() => {
            /* just hang there */
          });
        },
      })
      .catch(() => {
        /* muffin */
      });

    await t.rejects(c.tryAbort());
    t.same(abortCount, 0, "haven't aborted yet");
    t.true(ranFirstTask, "first task was run");
    t.false(cancelledFirstTask, "first task was not cancelled yet");

    allowAbort = true;
    await c.tryAbort();
    t.same(abortCount, 1, "we aborted once");
    t.true(c.isDead(), "context is dead now");
    await p1;

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
        if (isCancelled(e)) {
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

  s.case("Sub-context work", async t => {
    const c = new Context(store);

    let subRef;
    let canAbort = false;
    c
      .withSub(async sub => {
        subRef = sub;
        await sub.withStopper({
          stop: async () => {
            if (!canAbort) {
              throw new Error("can't abort");
            }
          },
          work: async () => {
            await new Promise(() => {
              /* muffin */
            });
          },
        });
      })
      .catch(() => {
        // woops
      });

    await t.rejects(c.tryAbort());
    canAbort = true;
    await c.tryAbort();
    t.true(c.isDead, "parent context is dead");
    t.true(subRef.isDead, "sub context is dead too");
  });
});
