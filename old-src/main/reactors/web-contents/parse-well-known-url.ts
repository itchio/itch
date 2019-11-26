import { parse } from "url";
import { mainLogger } from "main/logger";
const COLLECTION_URL_RE = /^\/c\/([0-9]+)/;
const DOWNLOAD_URL_RE = /^.*\/download\/[a-zA-Z0-9]*$/;

const logger = mainLogger.child(__filename);

export interface WellKnownUrlResult {
  resource: string;
  url: string;
}

export function parseWellKnownUrl(url: string): WellKnownUrlResult {
  try {
    const u = parse(url);
    if (u.hostname === "itch.io") {
      const collMatches = COLLECTION_URL_RE.exec(u.pathname);
      if (collMatches) {
        return {
          resource: `collections/${collMatches[1]}`,
          url,
        };
      }
    } else if (u.hostname.endsWith(".itch.io")) {
      const dlMatches = DOWNLOAD_URL_RE.exec(u.pathname);
      if (dlMatches) {
        let gameUrl = url.replace(/\/download.*$/, "");
        return {
          resource: null,
          url: gameUrl,
        };
      }
    }
  } catch (e) {
    logger.warn(`Could not parse url: ${url}`);
  }

  return null;
}
