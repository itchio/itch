import suite from "../test-suite";

import mkCooldown from "./cooldown";

suite(__filename, s => {
  s.case("cooldown (logic)", t => {
    const state = {
      time: 1000,
      delays: [],
    };
    const cooldown = mkCooldown(100, {
      getTime: () => state.time,
      delay: async (ms: number) => {
        state.delays.push(ms);
      },
    });

    cooldown();
    t.same(state.delays, []);

    cooldown();
    t.same(state.delays, [100]);

    cooldown();
    t.same(state.delays, [100, 200]);

    state.time = 1500;
    state.delays = [];

    cooldown();
    t.same(state.delays, []);

    cooldown();
    t.same(state.delays, [100]);

    state.time = 1650;
    state.delays = [];

    cooldown();
    t.same(state.delays, [50]);

    cooldown();
    t.same(state.delays, [50, 150]);
  });
  s.case("cooldown (real)", async t => {
    let counter = 0;

    const cooldown = mkCooldown(10);
    const add = async (x: number) => {
      await cooldown();
      counter += x;
    };

    await Promise.all([add(1), add(2), add(4)]);
    t.same(counter, 1 + 2 + 4);
  });
});
