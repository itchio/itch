import suite from "../test-suite";
import { spawn } from "child_process";

suite(__filename, s => {
  s.case("setTimeout", async t => {
    const cherrypie = async () => {
      await new Promise((resolve, reject) => setTimeout(resolve, 10));
      throw new Error(`after timeout`);
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    const refLine = 12;
    await checkStack(t, abacus(), refLine - 1, refLine - 2, refLine - 4);
  });

  s.case("spawn", async t => {
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
      t.is(code, 4);
      if (e) {
        throw new Error(e.stack);
      }
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    const refLine = 34;
    await checkStack(t, abacus(), refLine - 1, refLine - 2, refLine - 5);
  });

  s.case("after-await", async t => {
    const literallyAnything = async () => null;
    const cherrypie = async () => {
      await literallyAnything();
      throw new Error("in nested");
    };
    const binomial = async () => await cherrypie();
    const abacus = async () => await binomial();
    const refLine = 46;
    await checkStack(t, abacus(), refLine - 1, refLine - 2, refLine - 4);
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
    const refLine = 61; // should match with its line number
    await checkStack(s, abacus(), refLine - 1, refLine - 2, refLine - 4);
  });
});

async function checkStack(
  t,
  promise: Promise<any>,
  aLine: number,
  bLine: number,
  cLine: number
) {
  let threw = false;
  try {
    await promise;
  } catch (e) {
    threw = true;
    let seen = {
      a: false,
      b: false,
      c: false,
      aLine: false,
      bLine: false,
      cLine: false,
    };
    const aLinePattern = new RegExp(`\\.ts:${aLine}`);
    const bLinePattern = new RegExp(`\\.ts:${bLine}`);
    const cLinePattern = new RegExp(`\\.ts:${cLine}`);
    for (const line of e.stack.split("\n")) {
      if (/at abacus/.test(line)) {
        seen.a = true;
      }
      if (/at binomial /.test(line)) {
        seen.b = true;
      }
      if (/at cherrypie /.test(line)) {
        seen.c = true;
      }
      if (aLinePattern.test(line)) {
        seen.aLine = true;
      }
      if (bLinePattern.test(line)) {
        seen.bLine = true;
      }
      if (cLinePattern.test(line)) {
        seen.cLine = true;
      }
    }

    if (
      !seen.a ||
      !seen.b ||
      !seen.c ||
      !seen.aLine ||
      !seen.bLine ||
      !seen.cLine
    ) {
      // tslint:disable-next-line
      console.log(`Offensive stack trace:\n${e.stack}`);
    }
    t.true(seen.a, "stack trace contains abacus");
    t.true(seen.b, "stack trace contains binomial");
    t.true(seen.c, "stack trace contains cherrypie");
    t.true(seen.aLine, "stack trace line in abacus");
    t.true(seen.bLine, "stack trace line in binomial");
    t.true(seen.cLine, "stack trace line in cherrypie");
  }

  if (!threw) {
    throw new Error(`should reject`);
  }
}
