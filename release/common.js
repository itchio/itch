// base functions useful throughout CI scripts

const $ = require("munyx");

$.benchmark = true;

$.buildTag = function () {
  const v = process.env.CI_BUILD_TAG
  if (!v) {
    return "v9999.0.0"
  }
  return v
}

$.hasTag = function () {
  return !!process.env.CI_BUILD_TAG;
}

module.exports = $;
