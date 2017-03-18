
import {EventEmitter} from "events";

import * as btoa from "btoa";
import * as ospath from "path";
import * as invariant from "invariant";
import * as querystring from "querystring";

import {app, BrowserWindow, shell} from "../../electron";

import spawn from "../../util/spawn";
import url from "../../util/url";
import fetch from "../../util/fetch";
import pathmaker from "../../util/pathmaker";
import debugBrowserWindow from "../../util/debug-browser-window";

import Connection from "../../capsule/connection";
const Messages = require("../../capsule/messages_generated").Capsule.Messages;

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

const WEBGAME_PROTOCOL = "itch-cave";

import mklog from "../../util/log";
const log = mklog("launch/html");

import {IStartTaskOpts} from "../../types";

interface IBeforeSendHeadersDetails {
  url: string;
}

interface IBeforeSendHeadersCallbackOpts {
  cancel: boolean;
}

interface IBeforeSendHeadersCallback {
  (opts: IBeforeSendHeadersCallbackOpts): void;
}

interface IRegisteredProtocols {
  [key: string]: boolean;
}

const registeredProtocols: IRegisteredProtocols = {};

interface IRegisterProtocolOpts {
  partition: string;
  fileRoot: string;
}

async function registerProtocol (opts: IRegisterProtocolOpts) {
  const {partition, fileRoot} = opts;
  
  if (registeredProtocols[partition]) {
    return;
  }

  const {session} = require("electron");
  const caveSession = session.fromPartition(partition);

  await new Promise((resolve, reject) => {
    caveSession.protocol.registerFileProtocol(WEBGAME_PROTOCOL, (request, callback) => {
      const urlPath = url.parse(request.url).pathname;
      const filePath = ospath.join(fileRoot, urlPath.replace(/^\//, ""));

      callback({
        path: filePath,
      });
    }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });

  const handled = await new Promise((resolve, reject) => {
    caveSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL, (result) => {
      resolve(result);
    });
  });

  if (!handled) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }

  registeredProtocols[partition] = true;
}

export default async function launch (out: EventEmitter, opts: IStartTaskOpts) {
  const {cave, market, credentials, args, env} = opts;
  invariant(cave, "launch-html has cave");
  invariant(market, "launch-html has market");
  invariant(credentials, "launch-html has credentials");
  invariant(env, "launch-html has env");
  invariant(args, "launch-html has args");

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game});
  const injectPath = ospath.resolve(__dirname, "..", "..", "inject", "game.js");

  const appPath = pathmaker.appPath(cave);
  const entryPoint = ospath.join(appPath, cave.gamePath);

  log(opts, `entry point: ${entryPoint}`);

  const {width, height} = cave.windowSize;
  log(opts, `starting at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${cave.gameId}`;

  let win = new BrowserWindow({
    title: game.title,
    icon: `./static/images/tray/${app.getName()}.png`,
    width, height,
    center: true,
    show: true,

    /* used to be black, but that didn't work for everything */
    backgroundColor: "#fff",

    /* the width x height we give is content size, window will be slightly larger */
    useContentSize: true,

    webPreferences: {
      /* don't let web code control the OS */
      nodeIntegration: false,
      /* don't enforce same-origin policy (to allow API requests) */
      webSecurity: false,
      allowRunningInsecureContent: true,
      /* hook up a few keyboard shortcuts of our own */
      preload: noPreload ? null : injectPath,
      /* stores cookies etc. in persistent session to save progress */
      partition,
    },
  });

  const itchObject = {
    env,
    args,
  };

  // open dev tools immediately if requested
  if (process.env.IMMEDIATE_NOSE_DIVE === "1") {
    debugBrowserWindow(`game ${game.title}`, win);
    win.webContents.openDevTools({mode: "detach"});
  }

  // hide menu, cf. https://github.com/itchio/itch/issues/232
  win.setMenuBarVisibility(false);
  win.setMenu(null);

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent();
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, "");
  win.webContents.setUserAgent(userAgent);

  // requests to 'itch-internal' are used to communicate between web content & the app
  let internalFilter = {
    urls: ["https://itch-internal/*"],
  };
  win.webContents.session.webRequest.onBeforeRequest({urls: ["itch-cave://*"]}, (details, callback) => {
    let parsed = url.parse(details.url);
    // resources in `//` will be loaded using itch-cave, we need to
    // redirect them to https for it to work - note this only happens with games
    // that aren't fully offline-mode compliant
    if (parsed.protocol === "itch-cave:" && parsed.host !== "game.itch") {
      callback({
        redirectURL: details.url.replace(/^itch-cave:/, "https:"),
      });
    } else {
      callback({});
    }
  });

  win.webContents.session.webRequest.onBeforeSendHeaders(
      internalFilter, (details: IBeforeSendHeadersDetails, callback: IBeforeSendHeadersCallback) => {
    callback({cancel: true});

    let parsed = url.parse(details.url);
    switch (parsed.pathname.replace(/^\//, "")) {
      case "exit-fullscreen":
        win.setFullScreen(false);
        break;
      case "toggle-fullscreen":
        win.setFullScreen(!win.isFullScreen());
        break;
      case "open-devtools":
        win.webContents.openDevTools({mode: "detach"});
        break;
      default:
        break;
    }
  });

  win.webContents.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  // serve files
  let fileRoot = ospath.dirname(entryPoint);
  let indexName = ospath.basename(entryPoint);

  await registerProtocol({partition, fileRoot});

  // nasty hack to pass in the itchObject
  const itchObjectBase64 = btoa(JSON.stringify(itchObject));
  const query = querystring.stringify({itchObject: itchObjectBase64});

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexName}?${query}`, options);

  let capsulePromise: Promise<number>;
  let connection: Connection;
  const capsulePath = process.env.CAPSULERUN_PATH;
  const capsuleEmitter = new EventEmitter();
  if (capsulePath) {
    log(opts, `Launching capsule...`);
    const capsulerunPath = ospath.join(capsulePath, "capsulerun");
    const capsulelibPath = ospath.join(capsulePath, "..", "libcapsule");

    const CAPS_RE = /<CAPS> (.*)$/;
    capsulePromise = spawn({
      command: capsulerunPath,
      args: [
        "-L", capsulelibPath,
        "--",
        "headless",
      ],
      onToken: (tok) => {
        log(opts, `[capsule out] ${tok}`);
      },
      onErrToken: async (tok) => {
        log(opts, `[capsule err] ${tok}`);
        const matches = CAPS_RE.exec(tok);
        if (matches) {
          const contents = matches[1];
          try {
            const obj = JSON.parse(contents);
            log(opts, `Got CAPS message: ${JSON.stringify(obj, null, 2)}`);

            if (obj.r_path && obj.w_path) {
              connection = new Connection(obj.r_path, obj.w_path);  
              try {
                await connection.connect();

                const [width, height] = win.getContentSize();
                log(opts, `framebuffer size: ${width}x${height}`);
                const components = 4;
                const pitch = width * components;

                const shoom = require("shoom");
                const shmPath = "capsule-html5.shm";
                const shmSize = pitch * height;
                const shm = new shoom.Shm({
                  path: shmPath,
                  size: shmSize,
                });
                shm.create();

                connection.writePacket((builder) => {
                  const offset = Messages.VideoSetup.createOffsetVector(builder, [0]);
                  const linesize = Messages.VideoSetup.createLinesizeVector(builder, [pitch]);
                  const shmemPath = builder.createString(shmPath);
                  const shmemSize = builder.createLong(shmSize);
                  Messages.Shmem.startShmem(builder);
                  Messages.Shmem.addPath(builder, shmemPath);
                  Messages.Shmem.addSize(builder, shmemSize);
                  const shmem = Messages.Shmem.endShmem(builder);
                  Messages.VideoSetup.startVideoSetup(builder);
                  Messages.VideoSetup.addWidth(builder, width);
                  Messages.VideoSetup.addHeight(builder, height);
                  Messages.VideoSetup.addPixFmt(builder, Messages.PixFmt.BGRA);
                  Messages.VideoSetup.addVflip(builder, 0);
                  Messages.VideoSetup.addOffset(builder, offset);
                  Messages.VideoSetup.addLinesize(builder, linesize);
                  Messages.VideoSetup.addShmem(builder, shmem);
                  const vs = Messages.VideoSetup.endVideoSetup(builder);
                  Messages.Packet.startPacket(builder);
                  Messages.Packet.addMessageType(builder, Messages.Message.VideoSetup);
                  Messages.Packet.addMessage(builder, vs);
                  const pkt = Messages.Packet.endPacket(builder);
                  builder.finish(pkt);
                });

                const wc = win.webContents;
                wc.beginFrameSubscription(function (frameBuffer) {
                  shm.write(0, frameBuffer);
                  const timestamp = Date.now() * 1000;

                  connection.writePacket((builder) => {
                    const frameTimestamp = builder.createLong(timestamp);
                    Messages.VideoFrameCommitted.startVideoFrameCommitted(builder);
                    Messages.VideoFrameCommitted.addTimestamp(builder, frameTimestamp);
                    Messages.VideoFrameCommitted.addIndex(builder, 0);
                    const vfc = Messages.VideoFrameCommitted.endVideoFrameCommitted(builder);
                    Messages.Packet.startPacket(builder);
                    Messages.Packet.addMessageType(builder, Messages.Message.VideoFrameCommitted);
                    Messages.Packet.addMessage(builder, vfc);
                    const pkt = Messages.Packet.endPacket(builder);
                    builder.finish(pkt);
                  });
                });
              } catch (e) {
                log(opts, `While attempting to connect capsule: ${e.stack}`);
              }
            }
          } catch (e) {
            log(opts, `Couldn't parse ${contents}: ${e}`);
          }
        }
      },
      emitter: capsuleEmitter,
      logger: opts.logger,
    });
    capsulePromise.catch((reason) => {
      // tslint:disable-next-line
      console.log(`capsule threw an error: ${reason}`);
    });
  }

  await new Promise((resolve, reject) => {
    win.on("close", () => {
      if (connection) {
        connection.close();
      }
      win.webContents.session.clearCache(resolve);
    });

    out.once("cancel", () => {
      win.close();
    });
  });
}
