
import test = require("zopf");

const noop = async () => null;
function mkcooldown () {
  return noop;
}

module.exports = test.module(mkcooldown);
