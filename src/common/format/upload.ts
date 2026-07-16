import { Upload, Build, Platform } from "common/butlerd/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}

export function uploadPlatformList(u: Upload): Platform[] {
  const platforms: Platform[] = [];
  if (u.platforms?.windows) {
    platforms.push(Platform.Windows);
  }
  if (u.platforms?.linux) {
    platforms.push(Platform.Linux);
  }
  if (u.platforms?.osx) {
    platforms.push(Platform.OSX);
  }
  return platforms;
}

function clean(s: string) {
  return s
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/, " ");
}

export function formatUploadTitleFancy(u: Upload): string {
  if (u.displayName) {
    return u.displayName;
  }
  if (u.filename) {
    return clean(u.filename);
  }
  return "?";
}

export function formatBuildVersionInfo(b: Build | undefined): string | null {
  if (!b) {
    return null;
  }

  if (b.userVersion) {
    return `v${b.userVersion}`;
  }
  return `#${b.version}`;
}
