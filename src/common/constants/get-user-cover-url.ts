import { User } from "common/butlerd/messages";
import frog from "static/images/avatars/frog.svg";
import frogCyan from "static/images/avatars/frog-cyan.svg";
import frogRed from "static/images/avatars/frog-red.svg";
import frogGold from "static/images/avatars/frog-gold.svg";
import frogBlue from "static/images/avatars/frog-blue.svg";

export function getUserCoverURL(user: User): string {
  const { coverUrl, stillCoverUrl } = user;
  return stillCoverUrl || coverUrl || getFrogCoverURL(user.id);
}

const frogs = [frog, frogCyan, frogRed, frogGold, frogBlue];

function getFrogCoverURL(userId: number): string {
  return frogs[userId % frogs.length];
}
