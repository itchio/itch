// tslint:disable:no-shadowed-variable

import { Application, BasicAppSettings } from "spectron";
import * as test from "zopf";
import * as bluebird from "bluebird";

import * as fs from "fs";

import mkdirpCallback = require("mkdirp");
const mkdirp = bluebird.promisify(mkdirpCallback);
import rimrafCallback = require("rimraf");
const rimraf = bluebird.promisify(rimrafCallback);

import {
  ISpec,
  ISpecOpts,
  IIntegrationTest,
  sleep,
  DefaultTimeout,
} from "./types";

import tape = require("tape");

import runTests from "./tests";

let failureCount = 0;

try {
  fs.mkdirSync("./screenshots");
} catch (e) {
  // eh well.
}

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
async function beforeEach(t: IIntegrationTest, opts: ISpecOpts) {
  // `t` is different for each spec, so we use
  // it to store some state.
  t.itch = {
    polling: true,
    exitCode: 0,
    pollPromise: null,
  };

  let specArgs = [];
  if (opts) {
    specArgs = opts.args || specArgs;
  }

  const args = [".", ...specArgs];

  if (opts.wipePrefix) {
    try {
      await rimraf("./tmp/prefix");
    } catch (e) {
      t.comment(`While wiping prefix: ${e.message}`);
    }
  }

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

  const settings: BasicAppSettings = {
    path: (electronBinaryPath as any) as string,
    args,
    env: {
      ITCH_APP_ENV: "test",
      NODE_ENV: "test",
    },
    chromeDriverLogPath: "./tmp/chrome-driver-log.txt",
    waitTimeout: DefaultTimeout,
  };
  // not included in typings for some reason;
  // (settings as any).webdriverLogPath = "./tmp/web-driver-logs";

  t.app = new Application(settings);
  t.comment(`starting app with args ${args.join(" ")}`);

  await t.app.start();
  t.comment("app started!");

  t.itch.pollPromise = pollLogs(t);
}

// Continuously fetch the test app's logs.
async function pollLogs(t: IIntegrationTest) {
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

test("integration tests", async t => {
  const afterEach = async (t: IIntegrationTest, opts: ISpecOpts) => {
    t.comment("cleaning up test...");

    if (!(t.app && t.app.isRunning())) {
      return;
    }

    if (opts.ownExit) {
      t.comment("waiting for test to exit on its own...");
      await t.itch.pollPromise;
    }

    t.itch.polling = false;
    if (!opts.ownExit) {
      t.comment("printing the last of logs...");
      await t.itch.pollPromise;
    }

    t.comment("stopping app...");
    try {
      await t.app.stop();
      t.comment(`app stopped. Exit code ${t.itch.exitCode}`);
    } catch (e) {
      t.comment(`could not stop app: ${e.stack}`);
      t.comment("sorry :( bailing out");
      process.exit(255);
      t.itch.exitCode = 255;
    }

    if (t.itch.exitCode !== 0) {
      throw new Error(`Non-zero exit code ${t.itch.exitCode}`);
    }
  };

  let filter = new RegExp("");
  let state = 0;
  for (const arg of process.argv) {
    if (state === 0) {
      if (arg === "--case") {
        state = 1;
      }
    } else {
      filter = new RegExp(arg);
      t.comment(`Only running tests matching ${filter}`);
      state = 0;
    }
  }

  // a little wrapper on top of zopf's test
  const spec: ISpec = function(name, f, opts) {
    if (!opts) {
      opts = {};
    }

    if (!filter.test(name)) {
      t.comment(`Skipping "${name}"`);
      return;
    }

    t.case(name, async (t: IIntegrationTest) => {
      const t1 = Date.now();

      t.safeScroll = async selector => {
        const c = t.app.client;
        await c.waitForExist(selector, DefaultTimeout);

        let numTries = 5;
        let err: Error;
        for (let i = 0; i < numTries; i++) {
          err = null;
          try {
            if (i > 0) {
              await sleep(400);
            }
            await c.scroll(selector);
            break;
          } catch (e) {
            t.comment(`could not scroll to ${selector}: ${e.stack}`);
            err = e;
          }
        }

        if (err) {
          t.comment(`While scrolling ${selector}`);
          throw err;
        }
      }

      t.safeClick = async selector => {
        const c = t.app.client;
        await c.waitForExist(selector, DefaultTimeout);
        let numTries = 5;
        let err: Error;
        for (let i = 0; i < numTries; i++) {
          err = null;
          try {
            if (i > 0) {
              await sleep(400);
            }
            await c.click(selector);
            break;
          } catch (e) {
            t.comment(`could not click ${selector}: ${e.stack}`);
            err = e;
          }
        }

        if (err) {
          t.comment(`While clicking ${selector}`);
          throw err;
        }
      };

      let err;
      try {
        await beforeEach(t, opts);
        await f(t);
      } catch (e) {
        t.comment(`In spec, caught ${e}`);
        failureCount++;

        try {
          const screenshotPath = `./screenshots/failure-${failureCount}.png`;
          const image = await t.app.browserWindow.capturePage();
          fs.writeFileSync(screenshotPath, image);
          t.comment(`Saved screenshot to ${screenshotPath}`);
        } catch (e) {
          t.comment(`Could not save screenshot: ${e.stack}`);
        }
        err = e;
      } finally {
        await afterEach(t, opts);
        const t2 = Date.now();
        t.comment(`Test ran in ${(t2 - t1).toFixed(3)}ms`);
      }

      if (err) {
        t.notOk(err, err.stack);
      }
    });
  };

  spec(
    "it runs integration tests",
    async t => {
      await runTests(t);
    },
    {
      wipePrefix: true,
    },
  );
});

import { execSync } from "child_process";

function kill() {
  if (process.platform === "darwin") {
    try {
      execSync("killall Electron");
    } catch (e) {
      if (/No matching processes/.test(e.stack)) {
        // tslint:disable-next-line
        console.log("Didn't need to kill app!");
      } else {
        // tslint:disable-next-line
        console.log(`While killing app: ${e.stack}`);
      }
    }
  } else {
    // tslint:disable-next-line
    console.log(`Not killing app on platform '${process.platform}'`);
  }
}

tape.onFinish(() => {
  // tslint:disable-next-line
  console.log("# tape finished!");

  kill();
});
