import { CaveSummary } from "../buse/messages";

export default function isCavePristine(cave: CaveSummary) {
  // FIXME: with buse, lastTouchedAt is never going to be null,
  // it's just going to be the unix epoch
  return !cave.lastTouchedAt;
}
