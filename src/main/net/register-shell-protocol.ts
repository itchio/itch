import { getErrorCode, getErrorStack } from "common/butlerd/errors";
import { Session } from "electron";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import { getAppPath } from "main/helpers/app";
import { mainLogger } from "main/logger";
import mime from "mime-types";
import { join, resolve, sep } from "path";

const SHELL_PROTOCOL = "itch-shell";

export const SHELL_ORIGIN = `${SHELL_PROTOCOL}://app`;

export const SHELL_ENTRY_PATH = "/dist/renderer/index.html";

export function makeShellURL(relativePath: string): string {
  return `${SHELL_ORIGIN}/${relativePath}`;
}

const logger = mainLogger.child(__filename);

const SHELL_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' https://img.itch.zone https://weblate.itch.zone",
  "connect-src 'self' https://dale.itch.zone",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

const registered = new Set<Session>();

/**
 * Serves the app shell (renderer bundles and static assets) over
 * itch-shell:// so the shell has a real origin instead of file://, which
 * would let an XSS'd page read arbitrary local files as subresources.
 */
export function registerShellProtocol(ses: Session) {
  if (registered.has(ses)) {
    return;
  }
  registered.add(ses);

  const root = resolve(getAppPath());
  // In dev the app path is the whole repo, so only expose the shipped
  // subtrees
  const allowedRoots = [
    resolve(root, "dist", "renderer"),
    resolve(root, "src", "static", "images"),
  ];

  ses.protocol.handle(SHELL_PROTOCOL, (request) => {
    try {
      const url = new URL(request.url);
      if (url.host !== "app") {
        return new Response(null, { status: 404 });
      }
      const decodedPath = decodeURI(url.pathname);
      const filePath = resolve(join(root, decodedPath.replace(/^\//, "")));
      if (!allowedRoots.some((r) => filePath.startsWith(r + sep))) {
        return new Response(null, { status: 404 });
      }

      const stats = statSync(filePath);
      if (!stats.isFile()) {
        return new Response(null, { status: 404 });
      }
      const contentType = mime.lookup(filePath) || "application/octet-stream";
      const stream = Readable.toWeb(
        createReadStream(filePath)
      ) as ReadableStream;
      const headers: Record<string, string> = {
        "content-type": contentType,
        "content-length": `${stats.size}`,
      };
      if (contentType === "text/html") {
        headers["content-security-policy"] = SHELL_CSP;
      }
      return new Response(stream, {
        status: 200,
        headers,
      });
    } catch (e) {
      if (getErrorCode(e) === "ENOENT") {
        return new Response(null, { status: 404 });
      }
      logger.warn(`while serving ${request.url}: ${getErrorStack(e)}`);
      return new Response(null, { status: 400 });
    }
  });
}
