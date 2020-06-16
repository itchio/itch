import env from "common/env";
import { getDistPath, getNodeModulesPath } from "common/util/resources";
import { protocol, session } from "electron";
import * as fs from "fs";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import * as filepath from "path";
import { Readable } from "stream";
import { makeIndexHTML } from "main/make-index-html";

let logger = mainLogger.childWithName("itch-protocol");

export class HTTPError extends Error {
  constructor(
    public statusCode: number,
    public headers: { [key: string]: string },
    public data: string
  ) {
    super(`HTTP ${statusCode}`);
  }
}

export function registerSchemesAsPrivileged() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "itch",
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
        corsEnabled: true,
      },
    },
    {
      scheme: "itch-cave",
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
        corsEnabled: true,
      },
    },
  ]);
}

let partitionsRegistered: {
  [key: string]: boolean;
} = {};

export async function registerItchProtocol(ms: MainState, partition: string) {
  if (partitionsRegistered[partition]) {
    logger.debug(`Already registered itch: for partition ${partition}`);
    return;
  }

  logger.debug(`Registering itch: for partition ${partition}`);

  let handler = getItchProtocolHandler();
  let ses = session.fromPartition(partition);
  ses.protocol.registerStreamProtocol("itch", handler);

  let preloadPath = filepath.resolve(__dirname, "preload.js");
  logger.info(`Renderer preload path is ${preloadPath}`);
  ses.setPreloads([preloadPath]);

  partitionsRegistered[partition] = true;
}

type ProtocolHandler = (
  req: Electron.Request,
  cb: (stream: Electron.StreamProtocolResponse) => void
) => void;
let protocolHandler: undefined | ProtocolHandler;

export function getItchProtocolHandler(): ProtocolHandler {
  if (protocolHandler) {
    logger.debug(`Using cached protocol handler`);
    return protocolHandler;
  }
  logger.debug(`Building protocol handler`);

  async function handleRequest(
    req: Electron.Request
  ): Promise<Electron.StreamProtocolResponse> {
    logger.debug(`[${req.method}] ${req.url}`);
    let url = new URL(req.url);

    let route = [url.hostname, url.pathname.replace(/^\//, "")]
      .filter((s) => s.length > 0)
      .join("/");
    let elements = route.split("/");

    elements = elements.slice(1);
    let firstEl = elements[0];

    let content, contentType;

    if (elements.length == 0) {
      // return index
      content = makeIndexHTML();
      contentType = "text/html; charset=UTF-8";
    } else {
      let fsPath;
      if (firstEl === "node_modules") {
        fsPath = filepath.join(getNodeModulesPath(), ...elements.slice(1));
      } else {
        fsPath = filepath.join(getDistPath(), ...elements);
      }
      logger.debug(`Request filesystem path: ${fsPath}`);

      contentType = mime.lookup(fsPath) || "application/octet-stream";
      content = await readFileAsBuffer(fsPath);
    }

    return {
      statusCode: 200,
      headers: {
        server: env.appName,
        "content-length": `${content.length}`,
        "content-type": contentType,
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=31536000",
      },
      data: asReadable(content),
    };
  }

  protocolHandler = asyncToSyncProtocolHandler(handleRequest);
  return protocolHandler;
}

export function asReadable(payload: string | Buffer): Readable {
  const data = new Readable();
  data.push(payload);
  data.push(null);
  return data;
}

export async function readFileAsBuffer(fsPath: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    fs.readFile(fsPath, { encoding: null /* binary */ }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export type SyncProtocolHandler = (
  req: Electron.Request,
  cb: (res: Electron.StreamProtocolResponse) => void
) => void;
export type AsyncProtocolHandler = (
  req: Electron.Request
) => Promise<Electron.StreamProtocolResponse>;

export function asyncToSyncProtocolHandler(
  aph: AsyncProtocolHandler
): SyncProtocolHandler {
  return (req, cb) => {
    aph(req)
      .then(cb)
      .catch((e) => {
        if (e instanceof HTTPError) {
          logger.debug(`Serving HTTP ${e.statusCode}: ${e.data}`);
          cb({
            statusCode: e.statusCode,
            headers: e.headers,
            data: asReadable(e.data),
          });
          return;
        } else {
          logger.debug(`Internal HTTP error ${e.statusCode}: ${e.stack}`);
          cb({
            statusCode: 500,
            headers: {
              "content-type": "text/plain",
            },
            data: asReadable(e.stack),
          });
          return;
        }
      });
  };
}
