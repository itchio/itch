import { ILocalizedString } from "./index";

export interface ITabInstances {
  [key: string]: ITabInstance;
}

export interface ITabWeb {
  /** numeric identifier of the electron web contents */
  webContentsId?: number;

  favicon?: string;
  editingAddress?: boolean;
  loading?: boolean;
}

export interface ITabPage {
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

export interface ITabInstance {
  /** pages visited in this tab */
  history: ITabPage[];

  /** current index of history shown */
  currentIndex: number;

  /** data for the current page - is cleared on navigation */
  data: ITabData;

  /** if sleepy, don't load until it's focused */
  sleepy?: boolean;

  /** label we had when saving the tab */
  savedLabel?: ILocalizedString;

  /** number that increments when we reload a tab */
  sequence: number;
}

export interface ITabData {
  web?: ITabWeb;
  label?: ILocalizedString;
}

export interface ITabDataSave {
  /** id of the tab */
  id: string;

  /** pages visited in this tab */
  history: ITabPage[];

  /** current index of history shown */
  currentIndex: number;
}
