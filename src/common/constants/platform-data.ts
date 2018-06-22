import { Architectures } from "common/butlerd/messages";

const data = {
  windows: { icon: "windows8", platform: "windows", emoji: "🏁" },
  linux: { icon: "tux", platform: "linux", emoji: "🐧" },
  osx: { icon: "apple", platform: "osx", emoji: "🍎" },
};
export default data;

export type PlatformHolder = {
  platforms: { [K in keyof typeof data]?: Architectures };
  type: "html" | any;
};

export function hasPlatforms(target: PlatformHolder): boolean {
  for (const key of Object.keys(data)) {
    if (target.platforms[key]) {
      return true;
    }
  }
  if (target.type === "html") {
    return true;
  }
  return false;
}
