/* node's standard url module - re-exported for legacy usage */
import env from "main/env";
export * from "url";

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
  } catch (e) {}
  return false;
}
