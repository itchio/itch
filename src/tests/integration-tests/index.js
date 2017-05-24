
// tslint:disable:no-shadowed-variable

const Application = require('spectron').Application;
const test = require("zopf");
const bluebird = require("bluebird");

const exitCodeRegexp = /this is the magic exit code: ([0-9]+)/;

test('application launch', async (t) => {
  const beforeEach = async (t, opts) => {
    t.itch = {
      polling: true,
      exitCode: 0,
    }

    let additionalArgs = []
    if (opts) {
      if (opts.args) {
        additionalArgs = opts.args;
      }
    }

    const args = [".", ...additionalArgs];
    try {
      require("fs").mkdirSync("tmp");
    } catch (e) {
      if (e.code === "EEXIST") {
        // ok
      } else {
        throw new Error(`Could not create log dir: ${e.stack}`);
      }
    }
    t.app = new Application({
      path: require("electron"),
      args,
      env: {
        NODE_ENV: "test",
      },
      chromeDriverLogPath: "tmp/chrome-driver-log.txt",
      webdriverLogPath: "tmp/web-driver-log.txt",
    })
    t.comment(`starting app with args ${args.join(" ")}`);
    await t.app.start();
    t.comment("app started!");

    t.itch.pollPromise = (async function () {
      try {
        while (true) {
          await bluebird.delay(250);

          if (!t.app || !t.app.isRunning()) { return; }
          for (const line of await t.app.client.getMainProcessLogs()) {
            t.comment(`☃ ${line}`);
            const matches = exitCodeRegexp.exec(line);
            if (matches) {
              t.itch.exitCode = +matches[1];
              t.comment(`Got exit code ${t.itch.exitCode} from main process`);
              return;
            }
          }

          if (!t.itch.polling) { return; }
        }
      } catch (e) {
        t.comment(`While polling logs: ${e.stack}`);
      }
    }())
  }

  const afterEach = async (t) => {
    t.comment("cleaning up test...");

    if (!(t.app && t.app.isRunning())) {
      return;
    }

    if (t.ownExit) {
      t.comment("waiting for test to exit on its own...");
      await t.itch.pollPromise;
    }

    t.comment("stopping app...");
    t.itch.polling = false;
    if (!t.ownExit) {
      t.comment("printing the last of logs...");
      await t.itch.pollPromise;
    }

    await t.app.stop()
    t.comment(`app stopped. Exit code ${t.itch.exitCode}`);

    if (t.itch.exitCode !== 0) {
      throw new Error(`Non-zero exit code ${t.itch.exitCode}`);
    }
  }

  const spec = function (name, f, opts) {
    t.case(name, async (t) => {
      const t1 = Date.now();
      let err;
      try {
        await beforeEach(t, opts);
        await f(t);
      } catch (e) {
        err = e;
      } finally {
        await afterEach(t);
        const t2 = Date.now();
        t.comment(`Test ran in ${(t2 - t1).toFixed(3)}ms`);
      }

      if (err) {
        throw err;
      }
    })
  }

  spec("it runs unit tests", async (t) => {
    t.ownExit = true;
  }, {
    args: ["--run-unit-tests"],
  })

  spec("it shows an initial window", async (t) => {
    const numWindows = await t.app.client.getWindowCount();
    t.is(numWindows, 1);
  })
})
