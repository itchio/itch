import { Platform } from "common/butlerd/messages";

const platforms = {
  linux: "Linux", // we hardly GNU you
  windows: "Windows",
  osx: "macOS", // since WWDC june 2016
  android: "Android",
};

/**
 * Formats a platform for humans to read.
 */
export function formatPlatform(p: Platform): string {
  return (platforms as any)[p] || p;
}

export function formatArch(arch: string): string {
  switch (arch) {
    case "ia32":
      return "32-bit";
    case "x64":
      return "64-bit";
    default:
      return arch;
  }
}
