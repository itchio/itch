import * as url from "main/util/url";
import { Session } from "electron";
import { createReadStream, statSync } from "original-fs";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import { join } from "path";

const registeredSessions = new Set<Session>();
const WEBGAME_PROTOCOL = "itch-cave";

const logger = mainLogger.child(__filename);

async function* iterateStream(stream) {
  for await (const chunk of stream) {
    yield chunk;
  }
}

// derived from
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
function iteratorToStream(iterator) {
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next()
      if (done) {
        controller.close()
      } else {
        controller.enqueue(value)
      }
    },
  })
}

export async function registerItchCaveProtocol(
  gameSession: Session,
  fileRoot: string
) {
  if (registeredSessions.has(gameSession)) {
    return;
  }
  registeredSessions.add(gameSession);

  gameSession.protocol.handle(
    WEBGAME_PROTOCOL,
    (request) => {
      const urlPath = url.parse(request.url).pathname;
      const decodedPath = decodeURI(urlPath);
      const rootlessPath = decodedPath.replace(/^\//, "");
      const filePath = join(fileRoot, rootlessPath);

      try {
        var stats = statSync(filePath);
        let headers = {
          server: "itch",
          "content-length": `${stats.size}`,
          "access-control-allow-origin": "*",
        };
        let contentType = mime.lookup(filePath);
        if (contentType) {
          headers["content-type"] = contentType;
        }
        var stream = iteratorToStream(iterateStream(createReadStream(filePath)));
        return new Response(stream, {
          headers,
          status: 200,
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

        return new Response(null, {
          headers: {},
          status: statusCode,
        });
      }
    }
  );

  if (!gameSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL)) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }
}
