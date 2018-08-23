import { User } from "common/butlerd/messages";
import { getImageURL } from "common/util/resources";

export function getUserCoverURL(user: User): string {
  const { coverUrl, stillCoverUrl } = user;
  return stillCoverUrl || coverUrl || getFrogCoverURL(user.id);
}

const frogs = [
  getImageURL("avatars/frog.svg"),
  getImageURL("avatars/frog-cyan.svg"),
  getImageURL("avatars/frog-red.svg"),
  getImageURL("avatars/frog-gold.svg"),
  getImageURL("avatars/frog-blue.svg"),
];

function getFrogCoverURL(userId: number): string {
  return frogs[userId % frogs.length];
}
