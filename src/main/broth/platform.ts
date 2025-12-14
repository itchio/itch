import { arch } from "main/os/arch";

/** platform in go format */
function goos(): string {
  let result = process.platform;
  if (result === "win32") {
    return "windows";
  }
  return result;
}

/** arch in go format */
function goarch() {
  let result = arch();
  if (result === "x64") {
    return "amd64";
  } else if (result === "ia32") {
    return "386";
  } else if (result === "arm64") {
    return "arm64";
  } else {
    return "unknown";
  }
}

export function platformString(): string {
  const os = goos();
  let arch: string;
  if (os === "darwin") {
    arch = "amd64";
  } else {
    arch = goarch();
  }
  return `${os}-${arch}`;
}
