import { IDownloadItem } from "../../types";

export default function isHeal(item: IDownloadItem): boolean {
  switch (item.reason) {
    case "heal":
    case "revert":
      return true;
    case "update":
      if (item.upgradePath) {
        return true;
      }
    default:
      return false;
  }
}
