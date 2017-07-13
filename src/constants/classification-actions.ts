import { ClassificationAction } from "../types";

export interface IClassificationActions {
  [key: string]: ClassificationAction;
}

export default {
  game: "launch",
  tool: "launch",

  assets: "open",
  game_mod: "open",
  physical_game: "open",
  soundtrack: "open",
  other: "open",
  comic: "open",
  book: "open",
} as IClassificationActions;
