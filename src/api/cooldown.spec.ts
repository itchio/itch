
import suite from "../test-suite";

import mkCooldown from "./cooldown";

suite(__filename, s => {
  s.case("cooldown", async t => {
    let counter = 0;

    const cooldown = mkCooldown(400);
    const f = async () => {
      await cooldown();
    };
    const sleep = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms));

    for (let i = 0; i < 3; i++) {
      f().then(() => { counter++; }).catch((e) => { /* muffin */ });
    }

    t.same(counter, 0);
    await sleep(200);
    t.same(counter, 1);
    await sleep(500);
    t.same(counter, 2);
  });
});
