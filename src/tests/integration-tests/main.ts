
// tslint:disable:no-shadowed-variable

import {Application} from "spectron";
import test = require("zopf");
import * as bluebird from "bluebird";

import * as mkdirpCallback from "mkdirp";
const mkdirp = bluebird.promisify(mkdirpCallback);

import runTests from "./tests";

// Lessons learned from messing around with spectron:
// 
// chromedriver really needs the app to start up fully - 
// it needs a BrowserWindow to connect to.
//
// That means we need an uncaught exception handler, and
// we can't process.exit() or app.exit() from the app
// in the test environment.
//
// Instead, we output a known string to the app's logs,
// which the test runner (this file) can actually fetch,
// and figure out what happened.
const exitCodeRegexp = /this is the magic exit code: ([0-9]+)/;

// When run in node.js (not electron's browser, not electron's renderer),
// this returns a path to electron-prebuilt's executable. Spectron is fine
// with it.
const electronBinaryPath = require("electron");

// This makes electron output renderer logs to browser logs as well.
// (Simply put: whatever ends up in the chrome devtools console also
// ends up in the terminal. Although, when run with spectron, nothing is
// connected to the terminal by default).
process.env.ELECTRON_ENABLE_LOGGING = "1";

// Start up the app
async function beforeEach (t, opts) {
  // `t` is different for each spec, so we use
  // it to store some state.
  t.itch = {
    polling: true,
    exitCode: 0,
  };

  let specArgs = [];
  if (opts) {
    specArgs = opts.args || specArgs;
  }

  const args = [".", ...specArgs];

  try {
    // with NODE_ENV=test, the app uses that folder
    // to store userData, desktop, home etc.
    // this lets us wipe it, copy it, or do whatever we
    // want to it between tests.
    await mkdirp("./tmp");
  } catch (e) {
    if (e.code === "EEXIST") {
      // ok
    } else {
      throw new Error(`Could not create app temporary dir: ${e.stack}`);
    }
  }

  t.app = new Application({
    path: electronBinaryPath as any as string,
    args,
    env: {
      NODE_ENV: "test",
    },
    chromeDriverLogPath: "./tmp/chrome-driver-log.txt",
  });
  t.comment(`starting app with args ${args.join(" ")}`);

  await t.app.start();
  t.comment("app started!");

  t.itch.pollPromise = pollLogs(t);
}

// Continuously fetch the test app's logs.
async function pollLogs (t) {
  try {
    while (true) {
      await bluebird.delay(500);

      if (t.app && t.app.isRunning()) {
        for (const line of await t.app.client.getMainProcessLogs()) {
          t.comment(`☃ ${line}`);
          const matches = exitCodeRegexp.exec(line);
          if (matches) {
            t.itch.exitCode = +matches[1];
            t.comment(`Got exit code ${t.itch.exitCode} from main process`);
            return;
          }
        }
      }

      if (!t.itch.polling) {
        return;
      }
    }
  } catch (e) {
    t.comment(`While polling logs: ${e.stack}`);
  }
}

test("integration tests", async (t) => {
  const afterEach = async (t) => {
    t.comment("cleaning up test...");

    if (!(t.app && t.app.isRunning())) {
      return;
    }

    if (t.ownExit) {
      t.comment("waiting for test to exit on its own...");
      await t.itch.pollPromise;
    }

    t.itch.polling = false;
    if (!t.ownExit) {
      t.comment("printing the last of logs...");
      await t.itch.pollPromise;
    }

    t.comment("stopping app...");
    await t.app.stop();
    t.comment(`app stopped. Exit code ${t.itch.exitCode}`);

    if (t.itch.exitCode !== 0) {
      throw new Error(`Non-zero exit code ${t.itch.exitCode}`);
    }
  };

  // a little wrapper on top of zopf's test
  const spec = function (name, f, opts) {
    t.case(name, async (t) => {
      const t1 = Date.now();
      let err;
      try {
        await beforeEach(t, opts);
        await f(t);
      } catch (e) {
        t.comment(`In spec, caught ${e}`);
        err = e;
      } finally {
        await afterEach(t);
        const t2 = Date.now();
        t.comment(`Test ran in ${(t2 - t1).toFixed(3)}ms`);
      }

      if (err) {
        // this'll make the test fail
        throw err;
      }
    });
  };

  runTests(spec);
});

require("tape").onFinish(() => {
  // tslint:disable-next-line
  console.log("tape finished!");
});
