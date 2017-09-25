import { IBuild } from "../types/index";

export function formatBuildVersion(build: IBuild): string {
  if (build) {
    if (build.userVersion) {
      return `${build.userVersion} (#${build.id})`;
    } else {
      return `#${build.id}`;
    }
  }
  return "<not versioned>";
}
