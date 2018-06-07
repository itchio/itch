import { classificationActions } from "common/constants/classification-actions";
import {
  Game,
  GameType,
  GameClassification,
  Platform,
  Platforms,
} from "common/butlerd/messages";
import { currentRuntime } from "main/os/runtime";

const runtime = currentRuntime();

export function isPlatformCompatible(game: Game): boolean {
  let hasTaggedPlatform = false;
  const platforms = game.platforms || ({} as Platforms);

  // TODO: architectures
  switch (runtime.platform) {
    case Platform.OSX:
      hasTaggedPlatform = !!platforms.osx;
      break;
    case Platform.Linux:
      hasTaggedPlatform = !!platforms.linux;
      break;
    case Platform.Windows:
      hasTaggedPlatform = !!platforms.windows;
      break;
  }

  const isHTMLGame = game.type === GameType.HTML;
  const isOpenable =
    classificationActions[game.classification || GameClassification.Game] ===
    "open";
  return hasTaggedPlatform || isHTMLGame || isOpenable;
}
