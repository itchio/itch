
/* node's standard url module */
import * as url from "url";

/** user.example.org => example.org */
export function subdomainToDomain(subdomain: string): string {
  const parts = subdomain.split(".");
  while (parts.length > 2) {
    parts.shift();
  }
  return parts.join(".");
}

export function isItchioURL(s: string): boolean {
  return url.parse(s).protocol === "itchio:";
}

export const parse = url.parse.bind(url);
export const format = url.format.bind(url);

export default { subdomainToDomain, isItchioURL, parse, format };
