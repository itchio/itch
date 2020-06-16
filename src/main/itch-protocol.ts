import env from "common/env";
import { getRendererDistPath } from "common/util/resources";
import { protocol, session } from "electron";
import * as fs from "fs";
import * as http from "http";
import { MainState } from "main";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import * as filepath from "path";
import { Readable } from "stream";
import { getAppPath } from "common/helpers/app";

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

function convertHeaders(
  input: http.IncomingHttpHeaders
): Record<string, string> {
  let output: Record<string, string> = {};
  for (const k of Object.keys(input)) {
    const v = input[k];
    switch (typeof v) {
      case "string":
        output[k] = v;
        break;
      case "object":
        output[k] = v[0];
        break;
    }
  }
  return output;
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

  let handler = getItchProtocolHandler(ms);
  let ses = session.fromPartition(partition);
  ses.protocol.registerStreamProtocol("itch", handler);

  let preloadPath = filepath.resolve(__dirname, "preload.js");
  console.log(`preloadPath = `, preloadPath);
  ses.setPreloads([preloadPath]);

  partitionsRegistered[partition] = true;
}

type ProtocolHandler = (
  req: Electron.Request,
  cb: (stream: Electron.StreamProtocolResponse) => void
) => void;
let protocolHandler: undefined | ProtocolHandler;

export function getItchProtocolHandler(ms: MainState): ProtocolHandler {
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

    let firstEl = elements[0];
    elements = elements.slice(1);

    switch (firstEl) {
      default: {
        let content, contentType;

        if (elements.length == 0) {
          // return index
          content = `
<!DOCTYPE HTML>
<html>

<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  ${
    process.env.NODE_ENV === "production"
      ? `
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'self' itch://* ws://127.0.0.1:* https://dale.itch.ovh; style-src 'unsafe-inline'; img-src 'self' itch://* https://img.itch.zone https://weblate.itch.ovh">
`
      : ""
  }
  <title>itch</title>
  <script>
  (function() {
    require("./lib/${env.name}/renderer");
  })();
  </script>
  <style>
    #app {
      min-height: 100%;
    }
  </style>
</head>

<body>
  <div id="app"></div>
</body>

</html>
          `;
          contentType = "text/html; charset=UTF-8";
        } else {
          // return file
          let fsPath = filepath.join(getRendererDistPath(), ...elements);

          contentType = mime.lookup(fsPath) || "application/octet-stream";
          // N.B: electron 7.1.2 release notes says custom stream handlers
          // should work now, but it doesn't appear to be the case, so
          // `createReadStream` is out of the question for now. Ah well.
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
        break;
      }
    }
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
          cb({
            statusCode: e.statusCode,
            headers: e.headers,
            data: asReadable(e.data),
          });
          return;
        } else {
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
