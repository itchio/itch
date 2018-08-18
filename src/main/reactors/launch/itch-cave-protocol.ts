import { ItchPromise } from "common/util/itch-promise";
import * as url from "common/util/url";
import { Session } from "electron";
import { createReadStream, statSync } from "fs";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import { join } from "path";

const registeredSessions = new Set<Session>();
const WEBGAME_PROTOCOL = "itch-cave";

const logger = mainLogger.child(__filename);

export async function registerItchCaveProtocol(
  gameSession: Session,
  fileRoot: string
) {
  if (registeredSessions.has(gameSession)) {
    return;
  }
  registeredSessions.add(gameSession);

  await new ItchPromise((resolve, reject) => {
    gameSession.protocol.registerStreamProtocol(
      WEBGAME_PROTOCOL,
      (request, callback) => {
        const urlPath = url.parse(request.url).pathname;
        const decodedPath = decodeURI(urlPath);
        const rootlessPath = decodedPath.replace(/^\//, "");
        const filePath = join(fileRoot, rootlessPath);

        try {
          var stats = statSync(filePath);
          var stream = createReadStream(filePath);
          callback({
            headers: {
              server: "itch",
              "content-type": mime.lookup(filePath),
              "content-length": stats.size,
              "access-control-allow-origin": "*",
            },
            statusCode: 200,
            data: stream as any, // *sigh*
          });
        } catch (e) {
          logger.warn(`while serving ${request.url}, got ${e.stack}`);
          let statusCode = 400;
          switch (e.code) {
            case "ENOENT":
              statusCode = 404;
              break;
            case "EPERM":
              statusCode = 401;
              break;
          }

          callback({
            headers: {},
            statusCode,
            data: null,
          });
          return;
        }
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
    gameSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL, result => {
      resolve(result);
    });
  });

  if (!handled) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }
}
