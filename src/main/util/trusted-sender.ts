import { WebFrameMain } from "electron";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

/**
 * True if an IPC event came from our own renderer. The app shell is the
 * only surface loaded over file://; remote content (webview, games) runs
 * on https/itch-cave origins and must not reach main-process IPC.
 */
export function isTrustedFrame(frame: WebFrameMain | null): boolean {
  if (!frame) {
    return false;
  }
  try {
    if (new URL(frame.url).protocol === "file:") {
      return true;
    }
  } catch {}
  logger.warn(`Rejecting IPC from untrusted frame: ${frame.url}`);
  return false;
}
