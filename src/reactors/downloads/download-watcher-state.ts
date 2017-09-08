import { IDownloadItem } from "../../types/index";
import Context from "../../context/index";

const state: {
  currentDownload: IDownloadItem;
  currentContext: Context;
} = {
  currentDownload: null,
  currentContext: null,
};

export default state;
