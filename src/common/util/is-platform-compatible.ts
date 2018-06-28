import {
  Game,
  GameClassification,
  GameType,
  Platform,
  Platforms,
} from "common/butlerd/messages";
import { classificationActions } from "common/constants/classification-actions";
import { currentRuntime } from "common/os/runtime";

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
