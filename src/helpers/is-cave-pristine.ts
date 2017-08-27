import { ICave } from "../db/models/cave";

export default function isCavePristine(cave: ICave) {
  return !cave.lastTouchedAt;
}
