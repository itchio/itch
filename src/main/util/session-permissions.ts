import { Session } from "electron";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

/** Default-deny permission policy: grant only the listed permissions. */
export function restrictSessionPermissions(
  ses: Session,
  allowed: string[]
): void {
  const allowedSet = new Set(allowed);

  ses.setPermissionRequestHandler((_wc, permission, callback, details) => {
    const granted = allowedSet.has(permission);
    if (!granted) {
      logger.warn(
        `Denied permission request "${permission}" from ${details.requestingUrl}`
      );
    }
    callback(granted);
  });

  ses.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    const granted = allowedSet.has(permission);
    if (!granted) {
      logger.debug(
        `Denied permission check "${permission}" from ${requestingOrigin}`
      );
    }
    return granted;
  });
}

// The in-app browser is for plain browsing of itch.io only. Anything
// device- or game-shaped belongs in a launched game, which has no
// restrictions.
export const WEBVIEW_PERMISSIONS = ["fullscreen", "clipboard-sanitized-write"];
