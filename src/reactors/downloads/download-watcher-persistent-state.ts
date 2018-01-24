import { IDownloadItem } from "../../types/index";
import Context from "../../context/index";

export interface IDownloadHandle {
  item: IDownloadItem;
  ctx: Context;
}

const state: {
  current: IDownloadHandle;
  handles: {
    [key: string]: IDownloadHandle;
  };
  discarded: {
    [key: string]: boolean;
  };
} = {
  current: null,
  handles: {},
  discarded: {},
};

export default state;
