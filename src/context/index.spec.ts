import { describe, it, assert } from "../test";

import { Context } from "./index";
import { IStore, isCancelled } from "../types";
const store = {} as IStore;

describe("Context", () => {
  it("Context propagates progress", async () => {
    const c = new Context(store);

    let p1 = 0;
    let p2 = 0;
    c.on("progress", info => {
      p1 = info.progress;
    });
    c.on("progress", info => {
      p2 = info.progress;
    });

    assert.equal(p1, 0);
    assert.equal(p2, 0);

    c.emitProgress({ progress: 0.5 });

    assert.equal(p1, 0.5);
    assert.equal(p2, 0.5);
  });

  it("Context returns result", async () => {
    const c = new Context(store);

    const ret = await (async () => {
      return c.withStopper({
        stop: async () => null,
        work: async () => 42,
      });
    })();

    assert.equal(ret, 42);
  });

  it("Context signals abort", async () => {
    const c = new Context(store);

    let abortCount = 0;
    let allowAbort = false;

    c.on("abort", () => {
      abortCount++;
    });

    assert.equal(abortCount, 0);
    assert.isFalse(c.isDead());

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

    await assert.isRejected(c.tryAbort());
    assert.equal(abortCount, 0);
    assert.isTrue(ranFirstTask);
    assert.isFalse(cancelledFirstTask);

    allowAbort = true;
    await c.tryAbort();
    assert.equal(abortCount, 1);
    assert.isTrue(c.isDead());
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

    assert.isFalse(ranSecondTask);
    await p2;
    assert.isTrue(cancelledSecondTask);

    await c.tryAbort();
    assert.equal(abortCount, 1);
  });

  it("Sub-context work", async () => {
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

    await assert.isRejected(c.tryAbort());
    canAbort = true;
    await c.tryAbort();
    await assert.isTrue(c.isDead());
    await assert.isTrue(subRef.isDead());
  });
});
