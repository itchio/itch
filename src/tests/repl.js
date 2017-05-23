global.require = require;
setInterval(function () {}, 100);

global.wait = function (p) {
  p
    .then((res) => console.log("Promise result: ", res))
    .catch((e) => console.log("Promise rejected: ", e))
}
