export interface WindowInitialParams {
  width?: number;
  height?: number;
}

const whitelist: { [key: string]: WindowInitialParams } = {
  "itch://downloads": {},
  "itch://preferences": {},
  "itch://applog": {},
  "itch://scan-install-locations": {
    width: 700,
    height: 500,
  },
};

export function opensInWindow(url: string): WindowInitialParams {
  return whitelist[normalizeURL(url)];
}

// Removes trailing slash in URL, if any
export function normalizeURL(url: string): string {
  return url.replace(/\/$/, "");
}
