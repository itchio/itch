import { ITabPage } from "common/types";

interface IBaseTabDataSet {
  [key: string]: ITabPage;
}

const stub = () => ({ url: null } as ITabPage);

const baseData = {
  "itch://featured": stub(),
  "itch://dashboard": stub(),
  "itch://collections": stub(),
  "itch://library": stub(),
  "itch://preferences": stub(),
  "itch://downloads": stub(),
  "itch://applog": stub(),
} as IBaseTabDataSet;

for (const key of Object.keys(baseData)) {
  baseData[key].url = key;
}

export default baseData;
