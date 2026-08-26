import { Game } from "common/butlerd/messages";
import { Logger } from "common/logger";
import { downloadToFileWithRetry } from "main/net/download";
import { copyFileSync, readdirSync, renameSync, unlinkSync } from "fs";
import { join } from "path";

function extensionFor(url: string): string {
  const m = /\.(png|jpe?g)(?:$|\?)/i.exec(url);
  return m ? `.${m[1].toLowerCase()}` : ".png";
}

/**
 * Downloads the game's cover into Steam's grid art slots (capsule, header,
 * hero, icon) for the given shortcut id. Returns the icon path, if any.
 */
export async function downloadGridArt(
  logger: Logger,
  configDir: string,
  shortId: string,
  game: Game
): Promise<string | undefined> {
  const coverUrl = game.stillCoverUrl || game.coverUrl;
  if (!coverUrl) {
    return undefined;
  }

  const gridDir = join(configDir, "grid");
  const ext = extensionFor(coverUrl);
  const capsule = join(gridDir, `${shortId}p${ext}`);
  try {
    await downloadToFileWithRetry(() => {}, logger, coverUrl, capsule);
  } catch (e) {
    // a failed download leaves a truncated file behind, and Steam would
    // render it
    try {
      unlinkSync(capsule);
    } catch (unlinkError) {
      // may not exist
    }
    throw e;
  }

  const copies = [
    join(gridDir, `${shortId}${ext}`),
    join(gridDir, `${shortId}_hero${ext}`),
    join(gridDir, `${shortId}_icon${ext}`),
  ];
  for (const target of copies) {
    copyFileSync(capsule, target);
  }
  return join(gridDir, `${shortId}_icon${ext}`);
}

const artFilePattern = (shortId: string) =>
  new RegExp(`^${shortId}(p|_hero|_icon|_logo)?\\.(png|jpe?g)$`);

/** carries art over when an entry's appid changes (repair, scheme change) */
export function renameGridArt(
  configDir: string,
  oldShortId: string,
  newShortId: string
) {
  const gridDir = join(configDir, "grid");
  let entries: string[];
  try {
    entries = readdirSync(gridDir);
  } catch (e) {
    return;
  }

  const re = artFilePattern(oldShortId);
  for (const name of entries) {
    if (re.test(name)) {
      try {
        renameSync(
          join(gridDir, name),
          join(gridDir, newShortId + name.slice(oldShortId.length))
        );
      } catch (e) {
        // best effort
      }
    }
  }
}

export function removeGridArt(configDir: string, shortId: string) {
  const gridDir = join(configDir, "grid");
  let entries: string[];
  try {
    entries = readdirSync(gridDir);
  } catch (e) {
    return;
  }

  const re = artFilePattern(shortId);
  for (const name of entries) {
    if (re.test(name)) {
      try {
        unlinkSync(join(gridDir, name));
      } catch (e) {
        // best effort
      }
    }
  }
}
