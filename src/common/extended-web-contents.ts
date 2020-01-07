import { WebContents } from "electron";

export type ExtendedWebContents = WebContents & {
  history: string[];
  currentIndex: number;
};
