import { execFileSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { processes } from "systeminformation";

// only hits are cached: a miss is re-queried so a Steam installed while
// the app runs is still found
let registrySteamPath: string | undefined;

function windowsRegistrySteamPath(): string | null {
  if (registrySteamPath !== undefined) {
    return registrySteamPath;
  }
  try {
    const out = execFileSync(
      "reg",
      ["query", "HKCU\\Software\\Valve\\Steam", "/v", "SteamPath"],
      { encoding: "utf8" }
    );
    const m = /SteamPath\s+REG_SZ\s+(.+)/.exec(out);
    if (m) {
      registrySteamPath = m[1].trim();
      return registrySteamPath;
    }
  } catch (e) {
    // no registry entry, or reg.exe unavailable
  }
  return null;
}

export function getSteamRoot(): string | null {
  const candidates: string[] = [];
  switch (process.platform) {
    case "win32": {
      // registry first: a custom-drive install must win over a stale
      // leftover at the default path
      const fromRegistry = windowsRegistrySteamPath();
      if (fromRegistry) {
        candidates.push(fromRegistry);
      }
      candidates.push(
        join(
          process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
          "Steam"
        ),
        join(process.env["ProgramFiles"] || "C:\\Program Files", "Steam")
      );
      break;
    }
    case "darwin":
      candidates.push(
        join(homedir(), "Library", "Application Support", "Steam")
      );
      break;
    case "linux":
      candidates.push(
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
        )
      );
      break;
  }

  for (const candidate of candidates) {
    if (existsSync(join(candidate, "userdata"))) {
      return candidate;
    }
  }
  return null;
}

/**
 * The userdata folder name for the most recently logged-in Steam account,
 * from loginusers.vdf. Falls back to the only userdata folder when there's
 * exactly one; null when the user can't be determined.
 */
export function getActiveUserId(root: string): string | null {
  const fromLoginUsers = mostRecentLoginUser(root);
  if (fromLoginUsers && existsSync(join(root, "userdata", fromLoginUsers))) {
    return fromLoginUsers;
  }

  let folders: string[];
  try {
    folders = readdirSync(join(root, "userdata"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => name !== "0" && name !== "ac" && /^\d+$/.test(name));
  } catch (e) {
    return null;
  }
  return folders.length === 1 ? folders[0] : null;
}

function mostRecentLoginUser(root: string): string | null {
  let text: string;
  try {
    text = readFileSync(join(root, "config", "loginusers.vdf"), "utf8");
  } catch (e) {
    return null;
  }

  let currentId: string | null = null;
  for (const line of text.split("\n")) {
    const idMatch = /^\s*"(7656\d{13})"\s*$/.exec(line);
    if (idMatch) {
      currentId = idMatch[1];
      continue;
    }
    if (currentId && /"mostrecent"\s+"1"/i.test(line)) {
      // steamid64 -> account id (the userdata folder name)
      return (BigInt(currentId) & 0xffffffffn).toString();
    }
  }
  return null;
}

export async function isSteamRunning(): Promise<boolean> {
  const { list } = await processes();
  return list.some((p) => {
    const name = (p.name || "").toLowerCase();
    return name === "steam" || name === "steam.exe" || name === "steam_osx";
  });
}
