import { ITabData } from "../../types";

export interface IBaseMeatProps {
  tab: string;
  tabData: ITabData;
  visible: boolean;
}

export interface IMeatProps extends IBaseMeatProps {
  tabPath: string;
}
