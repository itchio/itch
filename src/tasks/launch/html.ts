
import {EventEmitter} from "events";

import * as btoa from "btoa";
import {dirname, basename, join} from "path";
import * as invariant from "invariant";
import * as querystring from "querystring";

import {BrowserWindow, shell} from "electron";
import appEnv from "../../env";
const {appName} = appEnv;

import spawn from "../../os/spawn";
import * as paths from "../../os/paths";
import {getInjectPath} from "../../os/resources";
import url from "../../util/url";
import fetch from "../../util/fetch";
import debugBrowserWindow from "../../util/debug-browser-window";

import Connection from "../../capsule/connection";
import {capsule} from "../../capsule/messages_generated";
const {messages} = capsule;

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

const WEBGAME_PROTOCOL = "itch-cave";

import {IStartTaskOpts} from "../../types";

import store from "../../store/metal-store";

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
      const filePath = join(fileRoot, urlPath.replace(/^\//, ""));

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
  const {cave, market, credentials, args, env, logger} = opts;
  invariant(cave, "launch-html has cave");
  invariant(market, "launch-html has market");
  invariant(credentials, "launch-html has credentials");
  invariant(env, "launch-html has env");
  invariant(args, "launch-html has args");

  const game = await fetch.gameLazily(market, credentials, cave.gameId, {game: cave.game});

  const appPath = paths.appPath(cave, store.getState().preferences);
  const entryPoint = join(appPath, cave.gamePath);

  logger.info(`entry point: ${entryPoint}`);

  const {width, height} = cave.windowSize;
  logger.info(`starting at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${cave.gameId}`;

  let win = new BrowserWindow({
    title: game.title,
    icon: `./static/images/tray/${appName}.png`,
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
      preload: noPreload ? null : getInjectPath("game"),
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
  let fileRoot = dirname(entryPoint);
  let indexName = basename(entryPoint);

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
  const capsulerunPath = process.env.CAPSULERUN_PATH;
  const capsuleEmitter = new EventEmitter();
  if (capsulerunPath) {
    logger.info(`Launching capsule...`);

    const pipeName = "capsule_html5";
    connection = new Connection(pipeName);  

    capsulePromise = spawn({
      command: capsulerunPath,
      args: [
        "--pipe",
        pipeName,
        "--headless",
      ],
      onToken: (tok) => {
        logger.info(`[capsule out] ${tok}`);
      },
      onErrToken: async (tok) => {
        logger.info(`[capsule err] ${tok}`);
      },
      emitter: capsuleEmitter,
      logger: opts.logger,
    });

    capsulePromise.catch((reason) => {
      // tslint:disable-next-line
      console.log(`capsule threw an error: ${reason}`);
    });

    try {
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 1000);
      });
      await connection.connect();

      logger.info(`Should be connected now, will send videosetup soon`);
      await new Promise((resolve, reject) => {
        setTimeout(resolve, 1000);
      });

      const [contentWidth, contentHeight] = win.getContentSize();
      logger.info(`framebuffer size: ${contentWidth}x${contentHeight}`);
      const components = 4;
      const pitch = contentWidth * components;

      const shoom = require("shoom");
      const shmPath = "capsule_html5.shm";
      const shmSize = pitch * contentHeight;
      const shm = new shoom.Shm({
        path: shmPath,
        size: shmSize,
      });
      shm.create();

      connection.writePacket((builder) => {
        const offset = messages.VideoSetup.createOffsetVector(builder, [builder.createLong(0, 0)]);
        const linesize = messages.VideoSetup.createLinesizeVector(builder, [builder.createLong(pitch, 0)]);
        const shmemPath = builder.createString(shmPath);
        const shmemSize = builder.createLong(shmSize, 0);
        messages.Shmem.startShmem(builder);
        messages.Shmem.addPath(builder, shmemPath);
        messages.Shmem.addSize(builder, shmemSize);
        const shmem = messages.Shmem.endShmem(builder);
        messages.VideoSetup.startVideoSetup(builder);
        messages.VideoSetup.addWidth(builder, contentWidth);
        messages.VideoSetup.addHeight(builder, contentHeight);
        messages.VideoSetup.addPixFmt(builder, messages.PixFmt.BGRA);
        messages.VideoSetup.addVflip(builder, false);
        messages.VideoSetup.addOffset(builder, offset);
        messages.VideoSetup.addLinesize(builder, linesize);
        messages.VideoSetup.addShmem(builder, shmem);
        const vs = messages.VideoSetup.endVideoSetup(builder);
        messages.Packet.startPacket(builder);
        messages.Packet.addMessageType(builder, messages.Message.VideoSetup);
        messages.Packet.addMessage(builder, vs);
        const pkt = messages.Packet.endPacket(builder);
        builder.finish(pkt);
      });

      const wc = win.webContents;
      wc.beginFrameSubscription(function (frameBuffer) {
        shm.write(0, frameBuffer);
        const timestamp = Date.now() * 1000;

        if (connection.closed) {
          wc.endFrameSubscription();
        }

        connection.writePacket((builder) => {
          const frameTimestamp = builder.createLong(timestamp, 0);
          messages.VideoFrameCommitted.startVideoFrameCommitted(builder);
          messages.VideoFrameCommitted.addTimestamp(builder, frameTimestamp);
          messages.VideoFrameCommitted.addIndex(builder, 0);
          const vfc = messages.VideoFrameCommitted.endVideoFrameCommitted(builder);
          messages.Packet.startPacket(builder);
          messages.Packet.addMessageType(builder, messages.Message.VideoFrameCommitted);
          messages.Packet.addMessage(builder, vfc);
          const pkt = messages.Packet.endPacket(builder);
          builder.finish(pkt);
        });
      });
    } catch (e) {
      logger.error(`While attempting to connect capsule: ${e.stack}`);
    }
  }

  await new Promise((resolve, reject) => {
    win.on("close", async () => {
      if (connection) {
        connection.close();
      }
      if (capsulePromise) {
        await capsulePromise;
      }
      win.webContents.session.clearCache(resolve);
    });

    out.once("cancel", () => {
      win.close();
    });
  });
}
