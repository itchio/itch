let steamShortcutEditor: any;
try {
  steamShortcutEditor = require("steam-shortcut-editor");
} catch (error) {
  console.error("Failed to load steam-shortcut-editor:", error);
  steamShortcutEditor = null;
}
import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
  readFileSync,
} from "fs";
import { join } from "path";
import { app } from "electron";
import { SteamGameInfo } from "./index";
import {
  generateShortcutId,
  generateAppId,
  generateShortAppId,
} from "./steam-helper";
import { getSteamPath } from "./steam-path";
import { setupSteamImages } from "./steam-images";

interface ShortcutsResult {
  success: boolean;
  errors: string[];
}

function checkSteamUserDataDir(
  steamUserdataDir: string
): {
  folders: string[];
  error?: string;
} {
  if (!existsSync(steamUserdataDir)) {
    return {
      folders: [],
      error: `${steamUserdataDir} does not exist. Can't add game to Steam!`,
    };
  }

  const ignoreFolders = ["0", "ac"];
  const folders = readdirSync(steamUserdataDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((dirent) => ignoreFolders.every((folder) => folder !== dirent.name))
    .map((dirent) => dirent.name);

  if (folders.length <= 0) {
    return {
      folders: [],
      error: `${steamUserdataDir} does not contain a valid user directory!`,
    };
  }

  return { folders };
}

function readShortcutFile(file: string): any {
  if (!steamShortcutEditor)
    throw new Error("steam-shortcut-editor not available");
  const content = readFileSync(file);
  return steamShortcutEditor.parseBuffer(content, {
    autoConvertArrays: true,
    autoConvertBooleans: true,
    dateProperties: ["LastPlayTime"],
  });
}

function writeShortcutFile(file: string, object: any): string | undefined {
  if (!steamShortcutEditor)
    throw new Error("steam-shortcut-editor not available");
  const buffer = steamShortcutEditor.writeBuffer(object);
  try {
    writeFileSync(file, buffer);
    return;
  } catch (error) {
    return `${error}`;
  }
}

function getAppName(object: ShortcutEntry): string {
  return Object.entries(object).find(
    ([key]) => key.toLowerCase() === "appname"
  )?.[1];
}

function checkIfAlreadyAdded(object: Partial<ShortcutObject>, title: string) {
  const shortcuts = object.shortcuts ?? [];
  return shortcuts.findIndex((entry) => getAppName(entry) === title);
}

export async function addNonSteamGame(props: {
  gameInfo: SteamGameInfo;
}): Promise<boolean> {
  if (!steamShortcutEditor) {
    throw new Error("steam-shortcut-editor not available");
  }

  const steamPath = await getSteamPath();
  if (!steamPath) {
    throw new Error("Steam installation not found");
  }

  const steamUserdataDir = join(steamPath, "userdata");
  const { folders, error } = checkSteamUserDataDir(steamUserdataDir);

  if (error) {
    throw new Error(error);
  }

  const errors: string[] = [];
  let added = false;

  for (const folder of folders) {
    try {
      const configDir = join(steamUserdataDir, folder, "config");
      const shortcutsFile = join(configDir, "shortcuts.vdf");

      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
      }

      if (!existsSync(shortcutsFile)) {
        writeShortcutFile(shortcutsFile, { shortcuts: [] });
      }

      const content = readShortcutFile(shortcutsFile);
      content.shortcuts = content.shortcuts ?? [];

      if (checkIfAlreadyAdded(content, props.gameInfo.title) > -1) {
        added = true;
        continue;
      }

      const newEntry = {} as any;
      newEntry.AppName = props.gameInfo.title;
      newEntry.Exe = `"${app.getPath("exe")}"`;
      newEntry.StartDir = `"${process.cwd()}"`;
      newEntry.LaunchOptions = `"itch://games/${props.gameInfo.app_name}"`;

      // Generate IDs first
      const appId = generateAppId(newEntry.Exe, newEntry.AppName);
      const shortAppId = generateShortAppId(newEntry.Exe, newEntry.AppName);
      newEntry.appid = generateShortcutId(newEntry.Exe, newEntry.AppName);

      newEntry.IsHidden = false;
      newEntry.AllowDesktopConfig = true;
      newEntry.AllowOverlay = true;
      newEntry.OpenVR = false;
      newEntry.Devkit = false;
      newEntry.DevkitOverrideAppID = false;
      newEntry.LastPlayTime = new Date();

      // Setup Steam images and get icon path using shortAppId for images
      const iconPath = await setupSteamImages(
        configDir,
        appId,
        shortAppId,
        props.gameInfo
      );
      newEntry.icon = iconPath;

      console.log("Complete shortcut entry before saving to shortcuts.vdf:");
      console.log(JSON.stringify(newEntry, null, 2));

      content.shortcuts.push(newEntry);

      const writeError = writeShortcutFile(shortcutsFile, content);
      if (writeError) {
        errors.push(
          `Failed to write shortcuts for user ${folder}: ${writeError}`
        );
        continue;
      }

      added = true;
    } catch (error) {
      errors.push(`Error processing user ${folder}: ${error}`);
    }
  }

  if (!added && errors.length > 0) {
    throw new Error(`Failed to add game to Steam: ${errors.join("; ")}`);
  }

  return added;
}
