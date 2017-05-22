
import * as os from "os";

export * from "./arch";
export * from "./assert-presence";

export type ItchPlatform = "osx" | "windows" | "linux" | "unknown";

export function platform(): string {
  return process.platform;
}

export function release(): string {
  return os.release();
}

export function arch(): string {
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
      return "osx";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unknown";
  }
}

export function cliArgs(): string[] {
  return process.argv;
}
