//@ts-check
"use strict";

const fs = require("fs");
const childProcess = require("child_process");
const readline = require("readline");

const chalk = {
  colors: {
    green: "\x1b[1;32;40m",
    yellow: "\x1b[1;33;40m",
    blue: "\x1b[1;34;40m",
    magenta: "\x1b[1;35;40m",
    cyan: "\x1b[1;36;40m",
    reset: "\x1b[0;0;0m",
  },
  /**
   * @param {any} s
   */
  green: function (s) {
    return `${chalk.colors.green}${s}${chalk.colors.reset}`;
  },
  /**
   * @param {any} s
   */
  yellow: function (s) {
    return `${chalk.colors.yellow}${s}${chalk.colors.reset}`;
  },
  /**
   * @param {any} s
   */
  blue: function (s) {
    return `${chalk.colors.blue}${s}${chalk.colors.reset}`;
  },
  /**
   * @param {any} s
   */
  magenta: function (s) {
    return `${chalk.colors.magenta}${s}${chalk.colors.reset}`;
  },
  /**
   * @param {any} s
   */
  cyan: function (s) {
    return `${chalk.colors.cyan}${s}${chalk.colors.reset}`;
  },
};

process.on("unhandledRejection", (reason, p) => {
  console.log("Unhandled Rejection at: Promise", p, "reason:", reason);
  process.exit(1);
});

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
 * @param {string} s
 */
function putln(s) {
  process.stdout.write(s + "\n");
  return true;
}

/**
 * @param {any} msg A message to prin
 */
function say(msg) {
  putln(chalk.yellow(`♦ ${msg}`));
  return true;
}

/**
 * @param {any} name
 * @param {() => any} cb
 */
async function measure(name, cb) {
  const start = Date.now();
  const ret = await cb();
  const end = Date.now();
  const ms = end - start;
  putln(chalk.cyan(`⌚ ${name} took ${(ms / 1000).toFixed(3)}s`));
  return ret;
}

/**
 * @param {string} cmd A command to launch (through bash)
 */
function system(cmd) {
  if (process.platform === "win32") {
    childProcess.execSync("bash", {
      stdio: ["pipe", "inherit", "inherit"],
      input: cmd,
    });
  } else {
    childProcess.execSync(cmd, {
      stdio: "inherit",
    });
  }
}

/**
 * Get stdout of a command
 * @param {string} cmd The command to run
 * @returns {string} The stdout, as a string
 */
function getOutput(cmd) {
  if (process.platform === "win32") {
    return childProcess.execSync("bash", {
      stdio: ["pipe", "inherit", "inherit"],
      input: cmd,
      encoding: "utf8",
    });
  } else {
    return childProcess.execSync(cmd, {
      stdio: "inherit",
      encoding: "utf8",
    });
  }
}

/**
 * @param {string} cmd Command to run
 */
function sh(cmd) {
  putln(chalk.blue(`· ${cmd}`));
  system(cmd);
}

/**
 * @template T
 * @param {string} dir Directory to cd to.
 * @param {() => Promise<T>} f Function to run inside the directory.
 * @returns {Promise<T>}
 */
async function cd(dir, f) {
  const originalWd = process.cwd();
  putln(chalk.magenta(`☞ entering ${dir}`));
  process.chdir(dir);
  try {
    return await f();
  } catch (err) {
    throw err;
  } finally {
    putln(chalk.magenta(`☜ leaving ${dir}`));
    process.chdir(originalWd);
  }
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
 * @param {string} file Path of the file to read
 * @returns {string} The file's contents as an utf-8 string
 */
function readFile(file) {
  return fs.readFileSync(file, { encoding: "utf8" });
}

/**
 * @param {string} file Path of the file to write
 * @param {string} contents The contents to write, as an utf-8 string
 */
function writeFile(file, contents) {
  return fs.writeFileSync(file, contents, { encoding: "utf8" });
}

/**
 * @param {import("fs").PathLike} dir
 * @returns {string[]} List of file names
 */
function ls(dir) {
  return fs.readdirSync(dir);
}

/**
 * @param {import("fs").PathLike} path
 * @returns {import("fs").Stats}
 */
function lstat(path) {
  return fs.lstatSync(path);
}

/**
 * @param {import("fs").Mode} mode
 * @param {import("fs").PathLike} path
 */
function chmod(mode, path) {
  fs.chmodSync(path, mode);
}

/**
 * @returns {string} The macOS app bundle ID for itch or kitch
 */
function appBundleId() {
  return `io.${getAppName()}.mac`;
}

/**
 * Display a prompt
 * @param {string} msg Question to ask (prompt text)
 * @returns {Promise<string>}
 */
async function prompt(msg) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise((resolve, reject) => {
    rl.question(chalk.green(`${msg}: `), (line) => {
      resolve(line);
    });
  });

  rl.close();

  return answer;
}

/**
 * Ask a yes/no question
 * @param {string} msg Yes/no question to ask
 * @returns {Promise<boolean>}
 */
async function yesno(msg) {
  return "y" == (await prompt(`${msg} (y/N)`));
}

/**
 * Ask a yes/no question, bail out if no
 * @param {string} msg Yes/no question to ask
 */
async function confirm(msg) {
  if (await yesno(msg)) {
    return;
  }

  say("Bailing out");
  process.exit(1);
}

module.exports = {
  chalk,
  OSES,
  ARCHES,
  putln,
  say,
  measure,
  system,
  getOutput,
  sh,
  cd,
  hasTag,
  getBuildTag,
  getBuildVersion,
  getAppName,
  getChannelName,
  readFile,
  writeFile,
  ls,
  lstat,
  chmod,
  appBundleId,
  prompt,
  yesno,
  confirm,
};
