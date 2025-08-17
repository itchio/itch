import { existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

export async function getSteamPath(): Promise<string | null> {
  const os = platform();
  let steamPaths: string[] = [];

  switch (os) {
    case "win32":
      steamPaths = [
        "C:\\Program Files (x86)\\Steam",
        "C:\\Program Files\\Steam",
        join(homedir(), "AppData", "Local", "Steam"),
        "D:\\Steam",
        "E:\\Steam",
      ];
      break;
    case "darwin":
      steamPaths = [
        join(homedir(), "Library", "Application Support", "Steam"),
        "/Applications/Steam.app/Contents/MacOS",
      ];
      break;
    case "linux":
      steamPaths = [
        join(homedir(), ".steam", "steam"),
        join(homedir(), ".local", "share", "Steam"),
        join(
          homedir(),
          ".var",
          "app",
          "com.valvesoftware.Steam",
          ".local",
          "share",
          "Steam"
        ), // Flatpak
        "/usr/share/steam",
        "/opt/steam",
      ];
      break;
  }

  for (const path of steamPaths) {
    if (existsSync(path)) {
      // Verify it's actually a Steam installation by checking for userdata folder
      const userdataPath = join(path, "userdata");
      if (existsSync(userdataPath)) {
        return path;
      }
    }
  }

  return null;
}
