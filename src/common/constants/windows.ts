const whitelist: { [key: string]: boolean } = {
  "itch://downloads": true,
  "itch://preferences": true,
  "itch://applog": true,
};

export function opensInWindow(url: string) {
  return whitelist[normalizeURL(url)];
}

// Removes trailing slash in URL, if any
export function normalizeURL(url: string): string {
  return url.replace(/\/$/, "");
}
