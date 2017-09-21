import { join } from "path";
import url from "../../../util/url";
import registeredProtocols from "./itch-internal-persistent-state";

const WEBGAME_PROTOCOL = "itch-cave";

export interface IBeforeSendHeadersDetails {
  url: string;
}

export interface IBeforeSendHeadersCallbackOpts {
  cancel: boolean;
}

export interface IBeforeSendHeadersCallback {
  (opts: IBeforeSendHeadersCallbackOpts): void;
}

export interface IRegisterProtocolOpts {
  partition: string;
  fileRoot: string;
}

import { session } from "electron";

export async function registerProtocol(opts: IRegisterProtocolOpts) {
  const { partition, fileRoot } = opts;

  if (registeredProtocols[partition]) {
    return;
  }

  const caveSession = session.fromPartition(partition, { cache: false });

  await new Promise((resolve, reject) => {
    caveSession.protocol.registerFileProtocol(
      WEBGAME_PROTOCOL,
      (request, callback) => {
        const urlPath = url.parse(request.url).pathname;
        // FIXME: this is wrong, the path may also be url-encoded, see
        // https://github.com/itchio/itch/issues/1211
        const filePath = join(fileRoot, urlPath.replace(/^\//, ""));

        callback(filePath);
      },
      error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      }
    );
  });

  const handled = await new Promise((resolve, reject) => {
    caveSession.protocol.isProtocolHandled(WEBGAME_PROTOCOL, result => {
      resolve(result);
    });
  });

  if (!handled) {
    throw new Error(`could not register custom protocol ${WEBGAME_PROTOCOL}`);
  }

  registeredProtocols[partition] = true;
}

type ItchInternalRequestCallback = (details: IBeforeSendHeadersDetails) => void;

interface ItchInternalOpts {
  session: Electron.Session;
  onRequest: ItchInternalRequestCallback;
}

export function setupItchInternal(opts: ItchInternalOpts) {
  const { session } = opts;

  // requests to 'itch-internal' are used to communicate between web content & the app
  const internalFilter = {
    urls: ["https://itch-internal/*"],
  };

  session.webRequest.onBeforeRequest(
    { urls: ["itch-cave://*"] },
    (details, callback) => {
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
    }
  );

  session.webRequest.onBeforeSendHeaders(
    internalFilter,
    (
      details: IBeforeSendHeadersDetails,
      callback: IBeforeSendHeadersCallback
    ) => {
      callback({ cancel: true });
      opts.onRequest(details);
    }
  );
}
