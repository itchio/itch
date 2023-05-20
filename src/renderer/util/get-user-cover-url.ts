import { User } from "common/butlerd/messages";
import { resources } from "renderer/bridge";

export function getUserCoverURL(user: User): string {
  const { coverUrl, stillCoverUrl } = user;
  return stillCoverUrl || coverUrl || getFrogCoverURL(user.id);
}

console.log(resources);
const frogs = [
  resources.getImageURL("avatars/frog.svg"),
  resources.getImageURL("avatars/frog-cyan.svg"),
  resources.getImageURL("avatars/frog-red.svg"),
  resources.getImageURL("avatars/frog-gold.svg"),
  resources.getImageURL("avatars/frog-blue.svg"),
];

function getFrogCoverURL(userId: number): string {
  return frogs[userId % frogs.length];
}
