import { ClassificationAction } from "../types";
import { GameClassification } from "../buse/messages";

interface IClassificationActions {
  [key: string]: ClassificationAction;
}

export default {
  [GameClassification.Game]: "launch",
  [GameClassification.Tool]: "launch",

  [GameClassification.Assets]: "open",
  [GameClassification.GameMod]: "open",
  [GameClassification.PhysicalGame]: "open",
  [GameClassification.Soundtrack]: "open",
  [GameClassification.Other]: "open",
  [GameClassification.Comic]: "open",
  [GameClassification.Book]: "open",
} as IClassificationActions;
