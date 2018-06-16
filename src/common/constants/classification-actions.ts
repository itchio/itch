import { ClassificationAction } from "common/types";
import { GameClassification } from "common/butlerd/messages";

interface ClassificationActions {
  [key: string]: ClassificationAction;
}

export const classificationActions = {
  [GameClassification.Game]: "launch",
  [GameClassification.Tool]: "launch",

  [GameClassification.Assets]: "open",
  [GameClassification.GameMod]: "open",
  [GameClassification.PhysicalGame]: "open",
  [GameClassification.Soundtrack]: "open",
  [GameClassification.Other]: "open",
  [GameClassification.Comic]: "open",
  [GameClassification.Book]: "open",
} as ClassificationActions;
