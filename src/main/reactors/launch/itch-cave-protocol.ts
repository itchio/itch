import * as url from "main/util/url";
import { Session } from "electron";
import { createReadStream, statSync } from "original-fs";
import { Readable } from "stream";
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

  gameSession.protocol.handle(WEBGAME_PROTOCOL, (request) => {
    const urlPath = url.parse(request.url).pathname;
    const decodedPath = decodeURI(urlPath);
    const rootlessPath = decodedPath.replace(/^\//, "");
    const filePath = join(fileRoot, rootlessPath);

    try {
      const stats = statSync(filePath);
      const contentType = mime.lookup(filePath) || "application/octet-stream";
      const stream = createReadStream(filePath);
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new Response(webStream, {
        status: 200,
        headers: {
          server: "itch",
          "content-length": `${stats.size}`,
          "content-type": contentType,
          "access-control-allow-origin": "*",
        },
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

      return new Response(null, { status: statusCode });
    }
  });
}
