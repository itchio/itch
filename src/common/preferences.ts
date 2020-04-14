export type TabLayout = "grid" | "table" | "list";

export interface PreferencesState {
  /** where to install games by default */
  defaultInstallLocation: string;

  /** use sandbox */
  isolateApps: boolean;

  /** when closing window, keep running in tray */
  closeToTray: boolean;

  /** notify when a download has been installed or updated */
  readyNotification: boolean;

  /** show the advanced section of settings */
  showAdvanced: boolean;

  /** language picked by the user */
  lang: string;

  /** if true, user's already seen the 'minimize to tray' notification */
  gotMinimizeNotification: boolean;

  /** should the itch app start on os startup? */
  openAtLogin: boolean;

  /** when the itch app starts at login, should it be hidden? */
  openAsHidden: boolean;

  /** show consent dialog before applying any game updates */
  manualGameUpdates: boolean;

  /** prevent display sleep while playing */
  preventDisplaySleep: boolean;

  /** layout to use to show games */
  layout: TabLayout;

  /** disable GPU acceleration, see #809 */
  disableHardwareAcceleration: boolean;
}
