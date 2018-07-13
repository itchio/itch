import { Upload, Build } from "common/butlerd/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}

export function formatBuildVersionInfo(b: Build): string {
  if (!b) {
    return null;
  }

  if (b.userVersion) {
    return `v${b.userVersion}`;
  }
  return `#${b.version}`;
}
