
module.exports = function (spec) {
  spec("it runs unit tests", async (t) => {
    t.ownExit = true;
  }, {
    args: ["--run-unit-tests"],
  })

  spec("it shows an initial window", async (t) => {
    const numWindows = await t.app.client.getWindowCount();
    t.is(numWindows, 1);
  })
}
