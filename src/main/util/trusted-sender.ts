import { WebFrameMain } from "electron";
import { mainLogger } from "main/logger";
import {
  SHELL_ENTRY_PATH,
  SHELL_ORIGIN,
} from "main/net/register-shell-protocol";

const logger = mainLogger.child(__filename);

/**
 * True if an IPC event came from our own renderer. Only the shell entry
 * point document is trusted, not the whole itch-shell:// origin: any
 * other asset served there that ends up as a scriptable document (an
 * SVG, say) stays unprivileged. Remote content (webview, games) runs on
 * https/itch-cave origins and must not reach main-process IPC.
 */
export function isTrustedFrame(frame: WebFrameMain | null): boolean {
  if (!frame) {
    return false;
  }
  try {
    const url = new URL(frame.url);
    if (
      frame.parent === null &&
      `${url.protocol}//${url.host}` === SHELL_ORIGIN &&
      url.pathname === SHELL_ENTRY_PATH
    ) {
      return true;
    }
  } catch {}
  logger.warn(`Rejecting IPC from untrusted frame: ${frame.url}`);
  return false;
}
