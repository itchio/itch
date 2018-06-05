import { classificationActions } from "common/constants/classification-actions";
import {
  Game,
  GameType,
  GameClassification,
  Platform,
} from "common/butlerd/messages";
import { currentRuntime } from "main/os/runtime";

const runtime = currentRuntime();

export function isPlatformCompatible(game: Game): boolean {
  let hasTaggedPlatform = false;
  // TODO: architectures
  switch (runtime.platform) {
    case Platform.OSX:
      hasTaggedPlatform = !!game.platforms.osx;
      break;
    case Platform.Linux:
      hasTaggedPlatform = !!game.platforms.linux;
      break;
    case Platform.Windows:
      hasTaggedPlatform = !!game.platforms.windows;
      break;
  }

  const isHTMLGame = game.type === GameType.HTML;
  const isOpenable =
    classificationActions[game.classification || GameClassification.Game] ===
    "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}
