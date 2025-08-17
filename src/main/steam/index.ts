import { Game } from "common/butlerd/messages";
import { Store } from "common/types";
import { addNonSteamGame } from "./steam-shortcuts";
import { mainLogger } from "main/logger";

const logger = mainLogger.child(__filename);

export interface SteamGameInfo {
  title: string;
  app_name: string;
  runner: string;
  art_cover?: string;
  art_square?: string;
  art_logo?: string;
}

export async function removeGameFromSteam(
  store: Store,
  game: Game
): Promise<boolean> {
  const prefs = store.getState().preferences;

  if (!prefs.addGamesToSteam) {
    return false;
  }

  logger.info(`Attempting to remove ${game.title} from Steam`);

  const gameInfo: SteamGameInfo = {
    title: game.title,
    app_name: game.id.toString(),
    runner: "itch",
    art_cover: game.coverUrl,
    art_square: game.stillCoverUrl,
  };

  try {
    const { removeNonSteamGame } = await import("./steam-shortcuts");
    const success = await removeNonSteamGame({ gameInfo });
    if (success) {
      logger.info(`Successfully removed ${game.title} from Steam`);
    } else {
      logger.warn(`Failed to remove ${game.title} from Steam`);
    }
    return success;
  } catch (error) {
    logger.error(`Error removing ${game.title} from Steam:`);
    logger.error(error);
    return false;
  }
}

export async function addGameToSteam(
  store: Store,
  game: Game
): Promise<boolean> {
  console.log("addGameToSteam called for:", game.title);
  const prefs = store.getState().preferences;
  console.log("Steam integration preference:", prefs.addGamesToSteam);

  if (!prefs.addGamesToSteam) {
    console.log("Steam integration disabled in preferences");
    logger.debug("Steam integration disabled in preferences");
    return false;
  }

  console.log(`Attempting to add ${game.title} to Steam`);
  logger.info(`Attempting to add ${game.title} to Steam`);

  const gameInfo: SteamGameInfo = {
    title: game.title,
    app_name: game.id.toString(),
    runner: "itch",
    art_cover: game.coverUrl,
    art_square: game.stillCoverUrl,
  };

  console.log("Game info:", gameInfo);

  try {
    const success = await addNonSteamGame({ gameInfo });
    console.log("addNonSteamGame result:", success);
    if (success) {
      console.log(`Successfully added ${game.title} to Steam`);
      logger.info(`Successfully added ${game.title} to Steam`);
    } else {
      console.log(`Failed to add ${game.title} to Steam`);
      logger.warn(`Failed to add ${game.title} to Steam`);
    }
    return success;
  } catch (error) {
    console.error(`Error adding ${game.title} to Steam:`, error);
    logger.error(`Error adding ${game.title} to Steam:`);
    logger.error(error);
    return false;
  }
}
