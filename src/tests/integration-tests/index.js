
// tslint:disable:no-shadowed-variable

const Application = require('spectron').Application;
const test = require("zopf");

const tape = require("tape");
const formatter = require("faucet");
tape.createStream().pipe(formatter()).pipe(process.stdout);

let app = null;

test('application launch', async (t) => {
  const beforeEach = async (t, opts) => {
    let additionalArgs = []
    if (opts) {
      if (opts.args) {
        additionalArgs = opts.args;
      }
    }

    const args = ["src/init.js", ...additionalArgs];
    app = new Application({
      path: require("electron"),
      args,
      env: {
        NODE_ENV: "test",
      },
    })
    t.comment(`starting app with args ${args.join(" ")}`);
    await app.start();
  }

  const afterEach = async (t) => {
    if (app && app.isRunning()) {
      await app.stop()
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
        t.comment(`caught error ${e.message}`);
        t.comment(`~~~ main process output ~~~`)
        t.comment(``)

        let logs = await app.client.getMainProcessLogs()
        logs.forEach(function (log) {
          console.log(log)
        })

        t.comment(``)
        t.comment(`~~~ render process output ~~~`)
        t.comment(``)

        logs = await app.client.getRenderProcessLogs()
          logs.forEach(function (log) {
          console.log(log.message)
          console.log(log.source)
          console.log(log.level)
        })

        t.comment(``)
        t.comment(`~~~ end of output ~~~`)
        t.comment(``)

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
    if ("pass" !== await app.browserWindow.getTitle()) {
      throw new Error("Unit tests failed!");
    }
  }, {
    args: ["--run-unit-tests"],
  })

  spec("it shows an initial window", async (t) => {
    t.same(await app.client.getWindowCount(), 1);
  })
})
