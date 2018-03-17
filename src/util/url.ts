/* node's standard url module */
import { parse } from "url";
export * from "url";

/** user.example.org => example.org */
export function subdomainToDomain(subdomain: string): string {
  const parts = subdomain.split(".");
  while (parts.length > 2) {
    parts.shift();
  }
  return parts.join(".");
}

export function isItchioURL(s: string): boolean {
  return parse(s).protocol === "itchio:";
}
