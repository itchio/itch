
// tslint:disable:no-shadowed-variable

const Application = require('spectron').Application;
const test = require("zopf");
const bluebird = require("bluebird");

// const tape = require("tape");
// const formatter = require("faucet");
// tape.createStream().pipe(formatter()).pipe(process.stdout);

const exitCodeRegexp = /this is the magic exit code: ([0-9]+)/;

test('application launch', async (t) => {
  const beforeEach = async (t, opts) => {
    t.itch = {
      polling: true,
      exitCode: 0,
      mainLogs: [],
      rendererLogs: [],
    }

    let additionalArgs = []
    if (opts) {
      if (opts.args) {
        additionalArgs = opts.args;
      }
    }

    const args = ["src/init.js", ...additionalArgs];
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
      webDriverLogPath: "tmp/web-driver-log.txt",
    })
    t.comment(`starting app with args ${args.join(" ")}`);
    await t.app.start();
    t.comment("app started!");

    t.itch.pollPromise = (async function () {
      try {
        while (true) {
          await bluebird.delay(250);
          if (!t.itch.polling) { return; }

          if (!t.app || !t.app.isRunning()) { return; }
          for (const line of await t.app.client.getMainProcessLogs()) {
            t.itch.mainLogs.push(line);
            const matches = exitCodeRegexp.exec(line);
            if (matches) {
              t.itch.exitCode = +matches[1];
              t.comment(`Got exit code ${t.itch.exitCode} from main process`);
              return;
            }
          }

          if (!t.app || !t.app.isRunning()) { return; }
          for (const line of await t.app.client.getRenderProcessLogs()) {
            t.itch.rendererLogs.push(line);
            const matches = re.exec(line);
            if (matches) {
              t.itch.exitCode = +matches[1];
              t.comment(`Got exit code ${t.itch.exitCode} from renderer process`);
              return;
            }
          }
        }
      } catch (e) {
        t.comment(`While polling logs: ${e.stack}`);
      }
    }())
  }

  const afterEach = async (t) => {
    if (!(t.app && t.app.isRunning())) {
      return;
    }

    if (t.ownExit) {
      await t.itch.pollPromise;
    }

    t.comment("stopping app...");
    t.itch.polling = false;
    if (!t.ownExit) {
      await t.itch.pollPromise;
    }

    await t.app.stop()
    t.comment("app stopped!");

    if (t.itch.exitCode !== 0) {
      t.comment(`Got exit code ${t.itch.exitCode}`);
      t.comment(`Main logs: `);
      for (const line of t.itch.mainLogs) {
        t.comment(line);
      }
      t.comment(`Renderer logs: `);
      for (const line of t.itch.rendererLogs) {
        t.comment(line);
      }

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
    await bluebird.delay(5000);
    t.same(await t.app.client.getWindowCount(), 1);
  })
})
