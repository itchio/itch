import { ITabData, ILocalizedString } from "../types";

export interface IBaseTabData extends ITabData {
  label?: ILocalizedString;
}

interface IBaseTabDataSet {
  [key: string]: IBaseTabData;
  featured: IBaseTabData;
  dashboard: IBaseTabData;
  collections: IBaseTabData;
  library: IBaseTabData;
  preferences: IBaseTabData;
  downloads: IBaseTabData;
}

const baseData = {
  featured: { label: "itch.io" },
  dashboard: { label: ["sidebar.dashboard"] },
  collections: { label: ["sidebar.collections"] },
  library: { label: ["sidebar.owned"] },
  preferences: { label: ["sidebar.preferences"] },
  downloads: { label: ["sidebar.downloads"] },
} as IBaseTabDataSet;

for (const key of Object.keys(baseData)) {
  baseData[key].path = key;
}

export default baseData;
