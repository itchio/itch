//@ts-check

import { chalk } from "@itchio/bob";

/** @type {{[key: string]: {}}} */
export const OSES = {
  windows: {},
  darwin: {},
  linux: {},
};

/** @type {{[key: string]: {electronArch: "ia32" | "x64"}}} */
export const ARCHES = {
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
export async function measure(name, cb) {
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
export function hasTag() {
  return !!process.env.CI_COMMIT_TAG || (!!process.env.GITHUB_REF_TYPE && process.env.GITHUB_REF_TYPE === 'tag');
}

/**
 * @returns {string} A string like v0.1.2, or v9999.0.0-canary
 */
export function getBuildTag() {
  let v = process.env.CI_COMMIT_TAG;
  if (!v && process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME) {
    v = process.env.GITHUB_REF_NAME;
  }
  if (!v) {
    return "v9999.0.0-canary";
  }
  return v;
}

/** @returns {string} A string like 0.1.2 */
export function getBuildVersion() {
  return getBuildTag().replace(/^v/, "").replace(/-.+$/, "");
}

/** @returns {string} The app's name (itch or kitch) */
export function getAppName() {
  if (/-canary$/.test(getBuildTag())) {
    return "kitch";
  } else {
    return "itch";
  }
}

/** @returns {string} Returns canary or stable */
export function getChannelName() {
  if (/-canary$/.test(getBuildTag())) {
    return "canary";
  } else {
    return "stable";
  }
}

/**
 * @returns {string} The macOS app bundle ID for itch or kitch
 */
export function appBundleId() {
  return `io.${getAppName()}.mac`;
}
