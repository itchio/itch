import { Build } from "node-buse/lib/messages";

export function formatBuildVersion(build: Build): string {
  if (build) {
    if (build.userVersion) {
      return `${build.userVersion} (#${build.id})`;
    } else {
      return `#${build.id}`;
    }
  }
  return "<not versioned>";
}
