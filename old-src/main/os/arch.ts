import { mainLogger } from "main/logger";
import { execSync } from "child_process";

const logger = mainLogger.child(__filename);
const WIN64_ARCHES = {
  AMD64: true,
  IA64: true,
} as {
  [key: string]: boolean;
};

export function arch(): string {
  switch (process.platform) {
    case "linux":
      return isLinux64() ? "x64" : "ia32";
    case "win32":
      return isWin64() ? "x64" : "ia32";
  }
  return process.arch;
}

/**
 * Returns true if we're currently running on a 64-bit version of Windows
 */
function isWin64(): boolean {
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
function isLinux64(): boolean {
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
