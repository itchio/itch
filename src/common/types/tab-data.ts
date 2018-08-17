import { LocalizedString } from "common/types";

export interface TabInstances {
  [key: string]: TabInstance;
}

export interface TabWeb {
  /** numeric identifier of the electron web contents */
  webContentsId?: number;
  hadFirstLoad?: boolean;

  favicon?: string;
  loading?: boolean;
}

export interface TabPage {
  /**
   * url of tab, something like:
   *   - itch://collections/:id
   *   - itch://games/:id
   *   - itch://preferences
   *   - https://google.com/
   *   - https://leafo.itch.io/x-moon
   */
  url: string;

  /**
   * resource associated with tab, something like
   *    - `games/:id`
   */
  resource?: string;
}

export interface TabInstance {
  /** pages visited in this tab */
  history: TabPage[];

  /** current index of history shown */
  currentIndex: number;

  /** data for the current page - is cleared on navigation */
  data: TabData;

  /** if sleepy, don't load until it's focused */
  sleepy?: boolean;

  /** label we had when saving the tab */
  savedLabel?: LocalizedString;

  /** number that increments when we reload a tab */
  sequence: number;
}

export interface TabData {
  web?: TabWeb;
  label?: LocalizedString;
}

export interface TabDataSave {
  /** id of the tab */
  id: string;

  /** pages visited in this tab */
  history: TabPage[];

  /** current index of history shown */
  currentIndex: number;
}
