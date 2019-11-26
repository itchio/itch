/**
 * Secret clicks are used to reveal internal screens, for
 * example, performing a secret click on the main itch logo
 * opens secret settings.
 * Performing a secret click on a tab shows its data, on a game
 * shows its install info, etc.
 */
export function isSecretClick(ev: React.MouseEvent<any>) {
  if (process.platform === "darwin") {
    // on macOS, ctrl+click is hard-wired to "secondary click", which
    // ends up being a context menu event, cf.
    // https://apple.stackexchange.com/questions/118276/disable-system-wide-ctrl-click-as-right-click-in-mavericks
    return ev.shiftKey && ev.metaKey;
  } else {
    return ev.shiftKey && ev.ctrlKey;
  }
}
