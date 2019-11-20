import { Readable } from "stream";
import * as fs from "fs";
import * as filepath from "path";
import * as ws from "ws";
import * as http from "http";
import { Client, Endpoint, Instance } from "butlerd";

import { messages } from "common/butlerd";
import urls from "common/constants/urls";
import { butlerUserAgent } from "common/constants/useragent";
import env from "common/env";
import { butlerDbPath } from "common/util/paths";
import { app, BrowserWindow, dialog, session, protocol } from "electron";
import { mainLogger } from "main/logger";
import dump from "common/util/dump";

import { getRendererDistPath } from "common/util/resources";
import { contentType } from "mime-types";

interface MainState {
  butler: ButlerState;
}

type ButlerState = ButlerStarting | ButlerConnecting;

interface ButlerStarting {
  type: "starting";
}

interface ButlerConnecting {
  type: "up";
  instance: Instance;
  endpoint: Endpoint;
}

let mainState: MainState = {
  butler: {
    type: "starting",
  },
};

async function main() {
  mainLogger.info(
    `${env.appName}@${app.getVersion()} on electron@${
      process.versions.electron
    } in ${env.production ? "production" : "development"}`
  );

  protocol.registerSchemesAsPrivileged([
    {
      scheme: "itch",
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
      },
    },
    {
      scheme: "itch-internal",
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
      },
    },
  ]);

  // 🎃🎃🎃
  // see https://github.com/electron/electron/issues/20127
  app.allowRendererProcessReuse = true;

  app.on("ready", () =>
    onReady().catch(e => {
      dialog.showErrorBox("Fatal error", e.stack);
      app.exit(2);
    })
  );
}

async function onReady() {
  await startButler();

  const wss = new ws.Server({
    host: "localhost",
    port: 0,
  });
  await new Promise((resolve, reject) => {
    wss.on("listening", resolve);
    wss.on("error", reject);
  });
  mainLogger.info(`wss address = ${dump(wss.address())}`);
  mainLogger.info(`process versions: ${dump(process.versions)}`);
  wss.on("connection", () => {
    mainLogger.info(`New websocket connection`);
  });

  let rendererSession = session.defaultSession;

  async function handleAPIRequest(
    req: Electron.HandlerRequest,
    elements: string[]
  ): Promise<Object> {
    return {
      message: "hello from main process API",
      url: req.url,
      elements,
    };
  }

  async function handleRequest(
    req: Electron.HandlerRequest
  ): Promise<Electron.StreamProtocolResponse> {
    mainLogger.info(`[${req.method}] ${req.url}`);
    for (const k of Object.keys(req.headers)) {
      const v = req.headers[k];
      mainLogger.info(`Header ${k}: ${v}`);
    }
    let url = new URL(req.url);

    let route = [url.hostname, url.pathname]
      .map(s => s.replace(/^\//g, ""))
      .map(s => s.replace(/\/$/g, ""))
      .filter(s => s.length > 0)
      .join("/");
    let elements = route.split("/");

    let firstEl = elements[0];
    elements = elements.slice(1);

    let error;
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
        break;
      }
      default: {
        if (elements.length == 0 || elements[0] != "assets") {
          elements = ["assets", "index.html"];
        }

        if (env.development) {
          let port = process.env.ELECTRON_WEBPACK_WDS_PORT;
          const upstream = `http://localhost:${port}/${elements.join("/")}`;
          mainLogger.info(`upstream = ${upstream}`);
          let res = await new Promise<http.IncomingMessage>(
            (resolve, reject) => {
              http.get(upstream, res => {
                resolve(res);
              });
            }
          );
          return {
            statusCode: res.statusCode,
            headers: { ...res.headers, "cache-control": "no-cache" },
            data: res,
          };
        } else {
          mainLogger.info(`elements = ${dump(elements)}`);
          let fsPath = filepath.join(getRendererDistPath(), ...elements);
          mainLogger.info(`fsPath = ${fsPath}`);

          let contentType = "application/octet-stream";
          let lowerPath = fsPath.toLowerCase();
          if (lowerPath.endsWith(".js")) {
            contentType = "text/javascript; charset=UTF-8";
          } else if (lowerPath.endsWith(".html")) {
            contentType = "text/html; charset=UTF-8";
          }
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

    throw new Error(`Unhandled route: ${route}`);
  }

  function asReadable(payload: string | Buffer): Readable {
    const data = new Readable();
    data.push(payload);
    data.push(null);
    return data;
  }

  rendererSession.protocol.registerStreamProtocol("itch", (req, cb) => {
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

  let win = new BrowserWindow({
    title: env.appName,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    webPreferences: {
      session: rendererSession,
      webviewTag: true,
    },
  });
  win.loadURL(makeAppURL());
  win.show();

  if (env.development || process.env.DEVTOOLS === "1") {
    win.webContents.openDevTools({
      mode: "detach",
    });
  }
}

async function startButler() {
  mainLogger.info("Starting butler daemon...");
  const instance = new Instance({
    butlerExecutable: "butler",
    args: [
      "--dbpath",
      butlerDbPath(),
      "--address",
      urls.itchio,
      "--user-agent",
      butlerUserAgent(),
      "--destiny-pid",
      `${process.pid}`,
    ],
  });
  let endpoint = await instance.getEndpoint();

  const client = new Client(endpoint);
  const res = await client.call(messages.VersionGet, {});
  mainLogger.info(`Using butler ${res.versionString}`);

  mainState.butler = {
    type: "up",
    instance,
    endpoint,
  };
}

function makeAppURL(): string {
  return `itch://app`;

  // if (env.development) {
  //   let port = process.env.ELECTRON_WEBPACK_WDS_PORT;
  //   return `http://localhost:${port}`;
  // } else {
  //   return `file:///${getRendererFilePath("index.html")}`;
  // }
}

main().catch(e => {
  dialog.showErrorBox(`${app.name} failed to start`, e.stack);
  app.exit(1);
});
