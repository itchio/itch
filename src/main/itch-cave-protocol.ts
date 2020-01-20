import { protocol, Session } from "electron";
import {
  asReadable,
  asyncToSyncProtocolHandler,
  HTTPError,
  readFileAsBuffer,
} from "main/itch-protocol";
import mime from "mime-types";
import { join } from "path";
import * as url from "url";

const registeredSessions = new Set<Session>();
const WEBGAME_PROTOCOL = "itch-cave";

export function registerItchCaveProtocol(
  gameSession: Session,
  fileRoot: string
) {
  if (registeredSessions.has(gameSession)) {
    return;
  }
  registeredSessions.add(gameSession);

  let asyncHandler = async (
    request: Electron.Request
  ): Promise<Electron.StreamProtocolResponse> => {
    const urlPath = url.parse(request.url).pathname;
    if (!urlPath) {
      throw new HTTPError(404, {}, "Not found");
    }
    const decodedPath = decodeURI(urlPath);
    const rootlessPath = decodedPath.replace(/^\//, "");
    const fsPath = join(fileRoot, rootlessPath);
    const contentType = mime.lookup(fsPath) || "application/octet-stream";

    const content = await readFileAsBuffer(fsPath);
    return {
      headers: {
        server: "itch",
        "content-length": `${content.length}`,
        "content-type": contentType,
        "access-control-allow-origin": "*",
      },
      statusCode: 200,
      data: asReadable(content),
    };
  };
  let syncHandler = asyncToSyncProtocolHandler(asyncHandler);

  gameSession.protocol.registerStreamProtocol(WEBGAME_PROTOCOL, syncHandler);
}
