import { Game } from "../../buse/messages";
import * as url from "url";
import Context from "../../context/index";
import { ICaveLocation } from "../../db/models/cave";
import * as sf from "../../os/sf";
import * as paths from "../../os/paths";

const slugRegexp = /^\/([^\/]+)/;

/** Gives a human-readable install folder name, given a game */
export function installFolderName(game: Game) {
  if (!game) {
    throw new Error(`No game provided to installFolderName`);
  }

  return installFolderNameFromSlug(game) || installFolderNameFromId(game);
}

function installFolderNameFromSlug(game: Game) {
  if (typeof game.url !== "string") {
    return null;
  }

  let parsed: url.Url;
  try {
    // url.parse may throw, in rare occasions
    // https://nodejs.org/docs/latest/api/url.html
    parsed = url.parse(game.url);
  } catch (e) {
    return null;
  }

  const matches = slugRegexp.exec(parsed.pathname);
  if (!matches) {
    return null;
  }

  const slug = matches[1];
  if (!slug) {
    return null;
  }

  return slug;
}

function installFolderNameFromId(game: Game) {
  return `game-${game.id}`;
}

/** Modifies.installFolder until it no longer exists on disk */
export async function ensureUniqueInstallFolder(
  ctx: Context,
  cave: ICaveLocation
) {
  let { installFolder } = cave;

  const { preferences } = ctx.store.getState();
  const installFolderExists = async function() {
    const fullPath = paths.appPath(cave, preferences);
    return await sf.exists(fullPath);
  };

  let seed = 2;
  // if you need more than 1200 games with the exact same name... you don't.
  while ((await installFolderExists()) && seed < 1200) {
    cave.installFolder = `${installFolder}-${seed++}`;
  }
}
