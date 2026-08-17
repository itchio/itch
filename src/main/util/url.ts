/* node's standard url module - re-exported for legacy usage */
import env from "main/env";
import { shell } from "electron";
import { mainLogger } from "main/logger";
export * from "url";

const logger = mainLogger.child(__filename);

// URLs can originate from remote web content, so they must not reach
// arbitrary OS protocol handlers
const allowedExternalProtocols = new Set(["http:", "https:", "mailto:"]);

export function openExternalURL(url: string) {
  let protocol: string;
  try {
    protocol = new URL(url).protocol;
  } catch {
    logger.warn(`Refusing to open unparseable external URL: ${url}`);
    return;
  }
  if (!allowedExternalProtocols.has(protocol)) {
    logger.warn(`Refusing to open external URL with protocol ${protocol}`);
    return;
  }
  shell.openExternal(url);
}

/** user.example.org => example.org */
export function subdomainToDomain(subdomain: string): string {
  const parts = subdomain.split(".");
  while (parts.length > 2) {
    parts.shift();
  }
  return parts.join(".");
}

const handledProtocols = [`${env.appName}io:`, `${env.appName}:`];

export function isItchioURL(s: string): boolean {
  try {
    let hasProperPrefix = false;
    for (const handledProtocol of handledProtocols) {
      if (s.startsWith(handledProtocol)) {
        hasProperPrefix = true;
        break;
      }
    }

    if (!hasProperPrefix) {
      return false;
    }

    const { protocol } = new URL(s);
    for (const handledProtocol of handledProtocols) {
      if (protocol === handledProtocol) {
        return true;
      }
    }
  } catch {}
  return false;
}
