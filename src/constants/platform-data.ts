const data = {
  pWindows: { icon: "windows8", platform: "windows", emoji: "🏁" },
  pLinux: { icon: "tux", platform: "linux", emoji: "🐧" },
  pOsx: { icon: "apple", platform: "osx", emoji: "🍎" },
};
export default data;

export type PlatformHolder = { [K in keyof typeof data]: boolean } & {
  type: "html" | any;
};

export function hasPlatforms(target: PlatformHolder): boolean {
  for (const key of Object.keys(data)) {
    if (target[key]) {
      return true;
    }
  }
  if (target.type === "html") {
    return true;
  }
  return false;
}
