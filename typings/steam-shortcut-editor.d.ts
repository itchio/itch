declare module "steam-shortcut-editor" {
  export interface ShortcutEntry {
    AppName: string;
    Exe: string;
    StartDir: string;
    LaunchOptions: string;
    appid: number;
    IsHidden: boolean;
    AllowDesktopConfig: boolean;
    AllowOverlay: boolean;
    OpenVR: boolean;
    Devkit: boolean;
    DevkitOverrideAppID: boolean;
    LastPlayTime: Date;
    icon?: string;
    [key: string]: any;
  }

  export interface ShortcutObject {
    shortcuts: ShortcutEntry[];
  }

  export function writeBuffer(object: Partial<ShortcutObject>): Buffer;
  export function parseBuffer(
    buffer: Buffer,
    options?: {
      autoConvertArrays?: boolean;
      autoConvertBooleans?: boolean;
      dateProperties?: string[];
    }
  ): Partial<ShortcutObject>;
}
