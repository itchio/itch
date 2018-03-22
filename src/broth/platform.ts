import { platform, arch } from "../os";

/** platform in go format */
export function goos(): string {
  let result = platform();
  if (result === "win32") {
    return "windows";
  }
  return result;
}

/** arch in go format */
export function goarch() {
  let result = arch();
  if (result === "x64") {
    return "amd64";
  } else if (result === "ia32") {
    return "386";
  } else {
    return "unknown";
  }
}
