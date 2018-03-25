import { Shm } from "shoom";

import * as btoa from "btoa";
import * as querystring from "querystring";

import { BrowserWindow, shell } from "electron";

import spawn from "../../os/spawn";
import { getInjectPath } from "../../os/resources";
import * as url from "../../util/url";
import debugBrowserWindow from "../../util/debug-browser-window";

import { Context } from "../../context";

import Connection from "../../capsule/connection";
import { capsule } from "../../capsule/messages_generated";
const { messages } = capsule;

const noPreload = process.env.LEAVE_TWINY_ALONE === "1";

import { registerProtocol, setupItchInternal } from "./html/itch-internal";
import {
  Game,
  HTMLLaunchParams,
  HTMLLaunchResult,
} from "../../butlerd/messages";
import { Logger } from "../../logger/index";

interface HTMLLaunchOpts {
  ctx: Context;
  game: Game;
  logger: Logger;

  params: HTMLLaunchParams;
}

export async function performHTMLLaunch(
  opts: HTMLLaunchOpts
): Promise<HTMLLaunchResult> {
  const { ctx, logger, game, params } = opts;
  const { rootFolder, indexPath, env, args } = params;

  // TODO: think if this is the right place to do that?
  let { width, height } = { width: 1280, height: 720 };
  const { embed } = game;
  if (embed && embed.width && embed.height) {
    width = embed.width;
    height = embed.height;
  }

  logger.info(`performing HTML launch at resolution ${width}x${height}`);

  const partition = `persist:gamesession_${game.id}`;

  // TODO: show game icon as, well, the window's icon
  let win = new BrowserWindow({
    title: game ? game.title : null,
    width,
    height,
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
    win.webContents.openDevTools({ mode: "detach" });
  }
  win.setMenu(null);

  // strip 'Electron' from user agent so some web games stop being confused
  let userAgent = win.webContents.getUserAgent();
  userAgent = userAgent.replace(/Electron\/[0-9.]+\s/, "");
  win.webContents.setUserAgent(userAgent);

  await registerProtocol({ partition, fileRoot: rootFolder });

  setupItchInternal({
    session: win.webContents.session,
    onRequest: details => {
      let parsed = url.parse(details.url);
      switch (parsed.pathname.replace(/^\//, "")) {
        case "exit-fullscreen":
          win.setFullScreen(false);
          break;
        case "toggle-fullscreen":
          win.setFullScreen(!win.isFullScreen());
          break;
        case "open-devtools":
          win.webContents.openDevTools({ mode: "detach" });
          break;
        default:
          break;
      }
    },
  });

  win.webContents.on("new-window", (ev: Event, url: string) => {
    ev.preventDefault();
    shell.openExternal(url);
  });

  // nasty hack to pass in the itchObject
  const itchObjectBase64 = btoa(JSON.stringify(itchObject));
  const query = querystring.stringify({ itchObject: itchObjectBase64 });

  // don't use the HTTP cache, we already have everything on disk!
  const options = {
    extraHeaders: "pragma: no-cache\n",
  };

  win.loadURL(`itch-cave://game.itch/${indexPath}?${query}`, options);

  let capsulePromise: Promise<number>;
  let connection: Connection;
  const capsulerunPath = process.env.CAPSULERUN_PATH;
  const capsuleContext = ctx.clone();
  if (capsulerunPath) {
    logger.info(`Launching capsule...`);

    const pipeName = "capsule_html5";
    connection = new Connection(pipeName);

    capsulePromise = spawn({
      command: capsulerunPath,
      args: ["--pipe", pipeName, "--headless"],
      onToken: tok => {
        logger.info(`[capsule out] ${tok}`);
      },
      onErrToken: async tok => {
        logger.info(`[capsule err] ${tok}`);
      },
      ctx: capsuleContext,
      logger: opts.logger,
    });

    capsulePromise.catch(reason => {
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

      const shmPath = "capsule_html5.shm";
      const shmSize = pitch * contentHeight;
      const shm = new Shm({
        path: shmPath,
        size: shmSize,
      });
      shm.create();

      connection.writePacket(builder => {
        const offset = messages.VideoSetup.createOffsetVector(builder, [
          builder.createLong(0, 0),
        ]);
        const linesize = messages.VideoSetup.createLinesizeVector(builder, [
          builder.createLong(pitch, 0),
        ]);
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
      wc.beginFrameSubscription(function(frameBuffer) {
        shm.write(0, frameBuffer);
        const timestamp = Date.now() * 1000;

        if (connection.closed) {
          wc.endFrameSubscription();
        }

        connection.writePacket(builder => {
          const frameTimestamp = builder.createLong(timestamp, 0);
          messages.VideoFrameCommitted.startVideoFrameCommitted(builder);
          messages.VideoFrameCommitted.addTimestamp(builder, frameTimestamp);
          messages.VideoFrameCommitted.addIndex(builder, 0);
          const vfc = messages.VideoFrameCommitted.endVideoFrameCommitted(
            builder
          );
          messages.Packet.startPacket(builder);
          messages.Packet.addMessageType(
            builder,
            messages.Message.VideoFrameCommitted
          );
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

    ctx.on("abort", () => {
      win.close();
    });
  });

  return {};
}
