//@ts-check
"use strict";

const { chalk } = require("@itchio/bob");

/** @type {{[key: string]: {}}} */
let OSES = {
  windows: {},
  darwin: {},
  linux: {},
};

/** @type {{[key: string]: {electronArch: "ia32" | "x64"}}} */
let ARCHES = {
  "386": {
    electronArch: "ia32",
  },
  amd64: {
    electronArch: "x64",
  },
};

/**
 * @param {any} name
 * @param {() => any} cb
 */
async function measure(name, cb) {
  const start = Date.now();
  const ret = await cb();
  const end = Date.now();
  const ms = end - start;
  console.log(chalk.cyan(`⌚ ${name} took ${(ms / 1000).toFixed(3)}s`));
  return ret;
}

/**
 * @returns {boolean} True if we're building a tag
 */
function hasTag() {
  return !!process.env.CI_BUILD_TAG;
}

/**
 * @returns {string} A string like v0.1.2, or v9999.0.0-canary
 */
function getBuildTag() {
  const v = process.env.CI_BUILD_TAG;
  if (!v) {
    return "v9999.0.0-canary";
  }
  return v;
}

/** @returns {string} A string like 0.1.2 */
function getBuildVersion() {
  return getBuildTag().replace(/^v/, "").replace(/-.+$/, "");
}

/** @returns {string} The app's name (itch or kitch) */
function getAppName() {
  if (/-canary$/.test(getBuildTag())) {
    return "kitch";
  } else {
    return "itch";
  }
}

/** @returns {string} Returns canary or stable */
function getChannelName() {
  if (/-canary$/.test(getBuildTag())) {
    return "canary";
  } else {
    return "stable";
  }
}

/**
 * @returns {string} The macOS app bundle ID for itch or kitch
 */
function appBundleId() {
  return `io.${getAppName()}.mac`;
}

module.exports = {
  OSES,
  ARCHES,
  measure,
  hasTag,
  getBuildTag,
  getBuildVersion,
  getAppName,
  getChannelName,
  appBundleId,
};
