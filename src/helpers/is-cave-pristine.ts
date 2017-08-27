import { ICaveSummary } from "../db/models/cave";

export default function isCavePristine(cave: ICaveSummary) {
  return !cave.lastTouchedAt;
}
