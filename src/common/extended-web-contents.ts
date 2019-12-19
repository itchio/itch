export type ExtendedWebContents = WebContents & {
  history: string[];
  currentIndex: number;
};
