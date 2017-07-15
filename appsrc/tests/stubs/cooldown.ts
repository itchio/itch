
import test = require("zopf");

const noop = async () => { /* muffin */ };
function mkcooldown () {
  return noop;
}

module.exports = test.module(mkcooldown);
