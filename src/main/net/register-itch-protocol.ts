import { Session } from "electron";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

let registered = new Set<Session>();

export function registerItchProtocol(ses: Session) {
  if (!registered.has(ses)) {
    registered.add(ses);

    logger.debug(
      `Registering itch: protocol for session with user agent ${ses.getUserAgent()}`
    );
    ses.protocol.registerStringProtocol(
      "itch",
      (req, cb) => {
        cb("");
      },
      e => {
        if (e) {
          logger.error(`While registering itch protocol: ${e.stack || e}`);
        }
      }
    );
  }
}
