import { IDownloadItem } from "../../types/index";
import Context from "../../context/index";

const state: {
  currentDownload: IDownloadItem;
  currentContext: Context;
  discarded: {
    [key: string]: boolean;
  };
} = {
  currentDownload: null,
  currentContext: null,
  discarded: {},
};

export default state;
