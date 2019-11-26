import { Platform } from "common/butlerd/messages";

/**
 * Get platform in the format used by the itch.io API
 */
export function itchPlatform(): Platform {
  switch (process.platform) {
    case "darwin":
      return Platform.OSX;
    case "win32":
      return Platform.Windows;
    case "linux":
      return Platform.Linux;
    default:
      return Platform.Unknown;
  }
}
