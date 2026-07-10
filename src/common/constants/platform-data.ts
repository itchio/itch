import { Architectures, Platforms } from "common/butlerd/messages";

interface PlatformData {
  icon: string;
  platform: string;
  emoji: string;
}

interface PlatformDataMap {
  windows: PlatformData;
  linux: PlatformData;
  osx: PlatformData;
  [key: string]: PlatformData;
}

const data: PlatformDataMap = {
  windows: { icon: "windows8", platform: "windows", emoji: "🏁" },
  linux: { icon: "tux", platform: "linux", emoji: "🐧" },
  osx: { icon: "apple", platform: "osx", emoji: "🍎" },
};
export default data;

export type PlatformHolder = {
  platforms: Platforms;
  type?: "html" | any;
};

export function hasPlatforms(target: PlatformHolder): boolean {
  for (const key of Object.keys(data)) {
    if ((target.platforms as { [key: string]: Architectures })[key]) {
      return true;
    }
  }
  if (target.type === "html") {
    return true;
  }
  return false;
}
