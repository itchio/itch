import { Upload, Build } from "common/butlerd/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
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

export function formatBuildVersionInfo(b: Build): string {
  if (!b) {
    return null;
  }

  if (b.userVersion) {
    return `v${b.userVersion}`;
  }
  return `#${b.version}`;
}
