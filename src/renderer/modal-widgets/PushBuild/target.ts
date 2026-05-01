import { Game } from "common/butlerd/messages";

/**
 * Derive a wharf-compatible target ("user/slug") from a game's canonical
 * itch.io URL. The owner comes from the URL's subdomain, so admin/team
 * projects resolve to their actual owner rather than the logged-in user.
 */
export function targetForGame(game: Game): string {
  const u = new URL(game.url);
  const host = u.hostname;
  const slug = u.pathname.replace(/^\/+|\/+$/g, "");
  const owner = host.slice(0, -".itch.io".length);
  return `${owner}/${slug}`;
}
