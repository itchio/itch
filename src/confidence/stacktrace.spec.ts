import suite from "../test-suite";
import { spawn } from "child_process";

suite(__filename, s => {
  s.case("setTimeout", async () => {
    const cherrypie = async () => {
      await new Promise((resolve, reject) => setTimeout(resolve, 10));
      throw new Error(`after timeout`);
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    await checkStack(s, abacus());
  });

  s.case("spawn", async () => {
    const cherrypie = async () => {
      let e: Error;
      const code = await new Promise<number>((resolve, reject) => {
        const child = spawn("i do not exist");
        child.on("close", () => resolve(2));
        child.on("error", e2 => {
          e = e2;
          resolve(4);
        });
      });
      s.is(code, 4);
      if (e) {
        throw e;
      }
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    await checkStack(s, abacus());
  });

  s.case("after-await", async () => {
    const literallyAnything = async () => null;
    const cherrypie = async () => {
      await literallyAnything();
      throw new Error("in nested");
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    await checkStack(s, abacus());
  });

  s.case("after-await-thrower", async () => {
    const literallyAnything = async () => null;
    const thrower = async () => {
      throw new Error("oh no");
    };
    const cherrypie = async () => {
      await literallyAnything();
      await thrower();
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    await checkStack(s, abacus());
  });
});

async function checkStack(t, promise: Promise<any>) {
  let threw = false;
  try {
    await promise;
  } catch (e) {
    threw = true;
    let seen = { a: false, b: false, c: false };
    for (const line of e.stack.split("\n")) {
      if (/at abacus /.test(line)) {
        seen.a = true;
      }
      if (/at binomial /.test(line)) {
        seen.b = true;
      }
      if (/at cherrypie /.test(line)) {
        seen.c = true;
      }
    }

    if (!seen.a || !seen.b || !seen.c) {
      // tslint:disable-next-line
      console.log(`Offensive stack trace:\n${e.stack}`);
    }
    t.true(seen.a, "seen a");
    t.true(seen.b, "seen b");
    t.true(seen.c, "seen c");
  }

  if (!threw) {
    throw new Error(`should reject`);
  }
}
