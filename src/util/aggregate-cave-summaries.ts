import { ICaveSummary } from "../db/models/cave";
import { fromDateTimeField } from "../db/datetime-field";

export function aggregateCaveSummaries(caves: ICaveSummary[]): ICaveSummary {
  let cave: ICaveSummary;
  if (caves.length === 0) {
    return cave;
  }

  let firstCave = caves[0];

  let installedSize: number = 0;
  let secondsRun: number = 0;
  let lastTouchedAt: Date;

  for (const c of caves) {
    if (c.installedSize > 0) {
      installedSize += c.installedSize;
    }

    if (c.secondsRun > 0) {
      secondsRun += c.secondsRun;
    }

    const cLastTouchedAt = fromDateTimeField(c.lastTouchedAt);
    if (cLastTouchedAt) {
      if (!lastTouchedAt) {
        // if that's the first lastTouchedAt value,
        // just set it
        lastTouchedAt = cLastTouchedAt;
      } else {
        // if it's not the first, we have to make sure it's greater
        // than the other one
        if (cLastTouchedAt.getTime() > lastTouchedAt.getTime()) {
          lastTouchedAt = cLastTouchedAt;
        }
      }
    }
  }

  cave = {
    // FIXME: I don't feel good about this, but maybe it's
    // better (crash early / noisily) than blindly passing
    // the first cave's ID? -- amos
    id: "<aggregate>",
    gameId: firstCave.gameId,
    installedSize,
    secondsRun,
    lastTouchedAt,
  };
  return cave;
}
