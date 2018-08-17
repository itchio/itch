import { join } from "path";
import * as url from "common/util/url";

const registeredSessions = new Set<Session>();
const WEBGAME_PROTOCOL = "itch-cave";

import { Session } from "electron";
import { ItchPromise } from "common/util/itch-promise";

export async function registerItchCaveProtocol(
  caveSession: Session,
  fileRoot: string
) {
  if (registeredSessions.has(caveSession)) {
    return;
  }
  registeredSessions.add(caveSession);

  await new ItchPromise((resolve, reject) => {
    caveSession.protocol.registerFileProtocol(
      WEBGAME_PROTOCOL,
      (request, callback) => {
        const urlPath = url.parse(request.url).pathname;
        const decodedPath = decodeURI(urlPath);
        const rootlessPath = decodedPath.replace(/^\//, "");
        const filePath = join(fileRoot, rootlessPath);

        callback(filePath);
      },
      error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });

  const handled = await new ItchPromise((resolve, reject) => {
    caveSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL, result => {
      resolve(result);
    });
  });

  if (!handled) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }
}
