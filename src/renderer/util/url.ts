import { url, querystring } from "renderer/bridge";

const wellKnownProtocols = ["http:", "https:", "itch:"];

function isWellKnownProtocol(protocol: string): boolean {
  return wellKnownProtocols.indexOf(protocol) !== -1;
}

export function transformUrl(original: string): string {
  if (/^about:/.test(original)) {
    return original;
  }

  let req = original;
  const searchUrl = (q: string) => {
    return "https://duckduckgo.com/?" + querystring.stringify({ q, kae: "d" });
  };

  // special search URLs
  if (/^\?/.test(original)) {
    return searchUrl(original.substr(1));
  }

  // spaces and no dots ? smells like a search request
  if (original.indexOf(" ") !== -1 && original.indexOf(".") === -1) {
    return searchUrl(original);
  }

  // add http: if needed
  let parsed = url.parse(req);
  if (!isWellKnownProtocol(parsed.protocol)) {
    req = "http://" + original;
    parsed = url.parse(req);
    if (!parsed.hostname) {
      return searchUrl(original);
    }
  }

  return req;
}
