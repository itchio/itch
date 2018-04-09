import { ITabInstance } from "common/types";

export interface IMeatProps {
  tab: string;
  tabInstance: ITabInstance;
  visible: boolean;
  loading: boolean;
}
