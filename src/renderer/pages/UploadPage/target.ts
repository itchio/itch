import { Game, Profile } from "common/butlerd/messages";

/**
 * Derive a wharf-compatible target ("user/slug") for a game owned by the
 * logged-in user. Returns null for games hosted on custom domains where
 * we can't reliably extract the slug.
 */
export function targetForGame(game: Game, profile: Profile): string | null {
  if (!game.url) return null;
  let slug: string;
  try {
    const u = new URL(game.url);
    slug = u.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    return null;
  }
  if (!slug || slug.includes("/")) return null;
  const username = profile.user?.username;
  if (!username) return null;
  return `${username}/${slug}`;
}
