import { MainState } from "main";
import { mainLogger } from "main/logger";
import env from "common/env";
import * as fs from "fs";
import * as http from "http";
import * as filepath from "path";
import dump from "common/util/dump";
import mime from "mime-types";
import { getRendererDistPath } from "common/util/resources";
import { session, protocol } from "electron";
import { Readable } from "stream";

let logger = mainLogger.childWithName("itch-protocol");

function convertHeaders(
  input: http.IncomingHttpHeaders
): Record<string, string> {
  let output = {};
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

export function prepareItchProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "itch",
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
      },
    },
  ]);
}

export async function registerItchProtocol(mainState: MainState) {
  async function handleAPIRequest(
    req: Electron.HandlerRequest,
    elements: string[]
  ): Promise<Object> {
    let ws = mainState.websocket;
    if (!ws) {
      throw new Error(`WebSocket not initialized yet! (this is a bug)`);
    }

    return {
      address: ws.address,
      url: req.url,
      elements,
    };
  }

  async function handleRequest(
    req: Electron.HandlerRequest
  ): Promise<Electron.StreamProtocolResponse> {
    logger.info(`[${req.method}] ${req.url}`);
    let url = new URL(req.url);

    let route = [url.hostname, url.pathname.replace(/^\//, "")]
      .filter(s => s.length > 0)
      .join("/");
    let elements = route.split("/");

    let firstEl = elements[0];
    elements = elements.slice(1);

    switch (firstEl) {
      case "api": {
        let payload = await handleAPIRequest(req, elements);
        return {
          statusCode: 200,
          headers: {
            "content-type": "application/json",
          },
          data: asReadable(JSON.stringify(payload)),
        };
      }
      default: {
        if (elements.length == 0 || elements[0] != "assets") {
          elements = ["assets", "index.html"];
        }

        if (env.development) {
          let port = process.env.ELECTRON_WEBPACK_WDS_PORT;
          const upstream = `http://localhost:${port}/${elements.join("/")}`;
          let res = await new Promise<http.IncomingMessage>(
            (resolve, reject) => {
              http.get(upstream, res => {
                resolve(res);
              });
            }
          );

          let headers = convertHeaders(res.headers);
          headers["cache-control"] = "no-cache";
          return {
            statusCode: res.statusCode,
            headers,
            data: res,
          };
        } else {
          logger.info(`elements = ${dump(elements)}`);
          let fsPath = filepath.join(getRendererDistPath(), ...elements);
          logger.info(`fsPath = ${fsPath}`);

          let contentType = mime.lookup(fsPath) || "application/octet-stream";
          let content = await new Promise<Buffer>((resolve, reject) => {
            fs.readFile(
              fsPath,
              { encoding: null /* binary */ },
              (err, data) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(data);
                }
              }
            );
          });

          return {
            statusCode: 200,
            headers: {
              server: env.appName,
              "content-length": `${content.length}`,
              "content-type": contentType,
            },
            data: asReadable(content),
          };
        }
        break;
      }
    }
  }

  function asReadable(payload: string | Buffer): Readable {
    const data = new Readable();
    data.push(payload);
    data.push(null);
    return data;
  }

  session.defaultSession.protocol.registerStreamProtocol("itch", (req, cb) => {
    handleRequest(req)
      .then(res => {
        cb(res);
      })
      .catch(e => {
        cb({
          statusCode: 500,
          headers: {
            "content-type": "text/plain",
          },
          data: asReadable(e.stack),
        });
      });
  });
}
