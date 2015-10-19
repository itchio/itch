
import keyMirror from 'keymirror'

export default keyMirror({
  BOOT: null,
  SETUP_STATUS: null,

  FOCUS_WINDOW: null,
  HIDE_WINDOW: null,
  LIBRARY_FOCUS_PANEL: null,

  /** User requested game to be installed */
  INSTALL_QUEUE: null,
  /** Internal install DB needs to be updated */
  INSTALL_UPDATE: null,
  /** Should probably replaced with an InstallStore.emit('change') event */
  INSTALL_PROGRESS: null,

  /** Set app-wide progress bar (title bar on Windows). Negative value clears. */
  SET_PROGRESS: null,
  /** OSX-only, bounce dock */
  BOUNCE: null,
  /** Cross-platform, notification bubble */
  NOTIFY: null,

  /* Data retrieval stuff */
  FETCH_GAMES: null,

  /** Ready but needs human login */
  NO_STORED_CREDENTIALS: null,
  /** Private - login attempt */
  LOGIN_WITH_PASSWORD: null,
  /** Wrong login/password or something else */
  LOGIN_FAILURE: null,
  /** API key available beyond this point */
  AUTHENTICATED: null,
  /** Asked to logout */
  LOGOUT: null,

  /** Sent from metal when needs to eval something in chrome. Example: HTML5 Notification API */
  EVAL: null,

  /** Buh-bye */
  QUIT: null
})
