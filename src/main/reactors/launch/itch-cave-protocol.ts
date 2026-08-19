import { getErrorStack, getErrorCode } from "common/butlerd/errors";
import * as url from "main/util/url";
import { Session } from "electron";
import {
  openSync,
  readSync,
  closeSync,
  createReadStream,
  realpathSync,
  statSync,
} from "original-fs";
import { Readable } from "stream";
import { createGunzip } from "zlib";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import { join, resolve, sep } from "path";

const registeredSessions = new Set<Session>();
const WEBGAME_PROTOCOL = "itch-cave";

const logger = mainLogger.child(__filename);

// gzip magic bytes: 1f 8b
const GZIP_MAGIC = Buffer.from([0x1f, 0x8b]);

function detectGzip(filePath: string): boolean {
  const fd = openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(2);
    const bytesRead = readSync(fd, buf, 0, 2, 0);
    return (
      bytesRead >= 2 && buf[0] === GZIP_MAGIC[0] && buf[1] === GZIP_MAGIC[1]
    );
  } finally {
    closeSync(fd);
  }
}

export async function registerItchCaveProtocol(
  gameSession: Session,
  fileRoot: string
) {
  if (registeredSessions.has(gameSession)) {
    return;
  }

  const absoluteRoot = resolve(fileRoot);
  const canonicalRoot = realpathSync(absoluteRoot);
  registeredSessions.add(gameSession);

  gameSession.protocol.handle(WEBGAME_PROTOCOL, (request) => {
    const urlPath = url.parse(request.url).pathname;
    if (!urlPath) {
      return new Response(null, { status: 404 });
    }
    const decodedPath = decodeURI(urlPath);
    const rootlessPath = decodedPath.replace(/^\//, "");
    const filePath = resolve(join(absoluteRoot, rootlessPath));

    // Chromium collapses ".." at the URL layer, but this handler serves
    // filesystem reads to a webSecurity:false window, so contain it here
    // too
    if (filePath !== absoluteRoot && !filePath.startsWith(absoluteRoot + sep)) {
      return new Response(null, { status: 404 });
    }

    try {
      // realpath resolves symlinks, so a link within the game cannot be used
      // to escape its root. Read via the canonical path as well, avoiding a
      // second traversal of the requested symlink.
      const canonicalPath = realpathSync(filePath);
      if (
        canonicalPath !== canonicalRoot &&
        !canonicalPath.startsWith(canonicalRoot + sep)
      ) {
        return new Response(null, { status: 404 });
      }

      const stats = statSync(canonicalPath);
      let contentType = mime.lookup(filePath) || "application/octet-stream";
      let stream: Readable = createReadStream(canonicalPath);

      // Decompress gzip/brotli files on the fly and serve the raw content.
      // Electron custom protocols don't support Content-Encoding, so we
      // can't rely on the browser to decompress — we do it ourselves.
      let compressed = false;

      if (filePath.endsWith(".gz") && detectGzip(canonicalPath)) {
        const realMime = mime.lookup(filePath.slice(0, -3));
        if (realMime) {
          contentType = realMime;
        }
        stream = stream.pipe(createGunzip());
        compressed = true;
      } else if (filePath.endsWith(".br")) {
        const realMime = mime.lookup(filePath.slice(0, -3));
        if (realMime) {
          contentType = realMime;
        }
        const { createBrotliDecompress } = require("zlib");
        stream = stream.pipe(createBrotliDecompress());
        compressed = true;
      } else if (filePath.endsWith(".unityweb") && detectGzip(canonicalPath)) {
        // Older Unity WebGL builds use .unityweb for gzip-compressed files
        // (e.g. game.framework.js.unityweb, game.wasm.unityweb, game.data.unityweb)
        const basename = filePath.slice(0, -".unityweb".length);
        const realMime = mime.lookup(basename);
        if (realMime) {
          contentType = realMime;
        }
        stream = stream.pipe(createGunzip());
        compressed = true;
      }

      const webStream = Readable.toWeb(stream) as ReadableStream;

      const headers: Record<string, string> = {
        server: "itch",
        "content-type": contentType,
        "access-control-allow-origin": "*",
      };

      // Only set content-length for non-compressed files since we don't
      // know the decompressed size ahead of time
      if (!compressed) {
        headers["content-length"] = `${stats.size}`;
      }

      return new Response(webStream, {
        status: 200,
        headers,
      });
    } catch (e) {
      logger.warn(`while serving ${request.url}, got ${getErrorStack(e)}`);
      let statusCode = 400;
      switch (getErrorCode(e)) {
        case "ENOENT":
          statusCode = 404;
          break;
        case "EPERM":
          statusCode = 401;
          break;
      }

      return new Response(null, { status: statusCode });
    }
  });
}
