
// tslint:disable:no-shadowed-variable

var Application = require('spectron').Application;
var test = require("zopf");

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
        let logs = await app.client.getMainProcessLogs()
        logs.forEach(function (log) {
          console.log(log)
        })

        logs = await app.client.getRenderProcessLogs()
          logs.forEach(function (log) {
          console.log(log.message)
          console.log(log.source)
          console.log(log.level)
        })

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
    t.same(await app.browserWindow.getTitle(), "pass");
  }, {
    args: ["--run-unit-tests"],
  })

  spec("it shows an initial window", async (t) => {
    t.same(await app.client.getWindowCount(), 1);
  })
})
