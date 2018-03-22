import * as os from "os";

export * from "./assert-presence";
import env from "../env";
import { ItchPlatform } from "../buse/messages";

export function platform(): string {
  return process.platform;
}

export function release(): string {
  return os.release();
}

export function arch(): string {
  switch (process.platform) {
    case "linux":
      return isLinux64() ? "x64" : "ia32";
    case "win32":
      return isWin64() ? "x64" : "ia32";
  }
  return process.arch;
}

export function inBrowser(): boolean {
  return processType() === "browser";
}

export function inRenderer(): boolean {
  return processType() === "renderer";
}

export function processType(): string {
  return process.type || "browser";
}

export type VersionKey = "electron" | "chrome";

export function getVersion(key: VersionKey): string {
  return process.versions[key];
}

/**
 * Get platform in the format used by the itch.io API
 */
export function itchPlatform(): ItchPlatform {
  switch (platform()) {
    case "darwin":
      return ItchPlatform.OSX;
    case "win32":
      return ItchPlatform.Windows;
    case "linux":
      return ItchPlatform.Linux;
    default:
      return ItchPlatform.Unknown;
  }
}

export function cliArgs(): string[] {
  return process.argv;
}

export function exit(exitCode: number) {
  if (env.name === "test") {
    console.log(`this is the magic exit code: ${exitCode}`);
  } else {
    const electron = require("electron");
    const app = electron.app || electron.remote.app;
    app.exit(exitCode);
  }
}

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "arch" });

import { execSync } from "child_process";

const WIN64_ARCHES = {
  AMD64: true,
  IA64: true,
} as {
  [key: string]: boolean;
};

/**
 * Returns true if we're currently running on a 64-bit version of Windows
 */
export function isWin64(): boolean {
  // 64-bit exe on 64-bit windows: PROCESSOR_ARCHITECTURE has the original arch
  // 32-bit exe on 64-bit windows: PROCESSOR_ARCHITECTURE has x86, PROCESSOR_ARCHITEW6432 has the real one
  return (
    process.arch === "x64" ||
    WIN64_ARCHES[process.env.PROCESSOR_ARCHITECTURE] ||
    WIN64_ARCHES[process.env.PROCESSOR_ARCHITEW6432]
  );
}

let hasDeterminedLinux64 = false;
let cachedIsLinux64: boolean;

/**
 * Returns true if we're currently running on a 64-bit version of Linux
 */
export function isLinux64(): boolean {
  if (!hasDeterminedLinux64) {
    cachedIsLinux64 = determineLinux64();
    hasDeterminedLinux64 = true;
  }
  return cachedIsLinux64;
}

function determineLinux64(): boolean {
  try {
    // weeeeeeeee
    const arch = String(execSync("uname -m")).trim();
    return arch === "x86_64";
  } catch (e) {
    logger.warn(`Could not determine if linux64 via uname: ${e.message}`);
  }

  try {
    // weeeeeeeee
    const arch = String(execSync("arch")).trim();
    return arch === "x86_64";
  } catch (e) {
    logger.warn(`Could not determine if linux64 via arch: ${e.message}`);
  }

  // if we're lacking uname AND arch, honestly, our chances are slim.
  // but in doubt, let's just assume the architecture of itch is the
  // same as the os.
  logger.warn(`Falling back to build architecture for linux64 detection`);
  return process.arch === "x64";
}
