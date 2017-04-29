
import * as electron from "electron";

import * as actions from "../actions";
import {ILocalizer} from "../localizer";

interface IContextMenuOpts {
  navigate: typeof actions.navigate;
}

export default function create(wv: Electron.WebViewElement, t: ILocalizer, opts: IContextMenuOpts) {
  const wc = wv.getWebContents();
  wc.on("context-menu", (e, props) => {
    const editFlags = props.editFlags;
    const hasText = props.selectionText.trim().length > 0;
    const can = (type: string) => ((editFlags as any)[`can${type}`] as boolean) && hasText;

    let menuTpl: Electron.MenuItemOptions[] = [{
      type: "separator",
    }, {
      id: "cut",
      label: t("web.context_menu.cut"),
      // needed because of macOS limitation:
      // https://github.com/electron/electron/issues/5860
      role: can("Cut") ? "cut" : null,
      enabled: can("Cut"),
      visible: props.isEditable,
    }, {
      id: "copy",
      label: t("web.context_menu.copy"),
      role: can("Copy") ? "copy" : null,
      enabled: can("Copy"),
      visible: props.isEditable || hasText,
    }, {
      id: "paste",
      label: t("web.context_menu.paste"),
      role: editFlags.canPaste ? "paste" : null,
      enabled: editFlags.canPaste,
      visible: props.isEditable,
    }, {
      type: "separator",
    }];

    if (props.linkURL && props.mediaType === "none") {
      menuTpl = [{
        type: "separator",
      },
      {
        id: "openInNewTab",
        label: t("web.context_menu.open_in_new_tab"),
        click() {
          opts.navigate("url/" + props.linkURL, {}, /* background */ true);
        },
      },
      {
        type: "separator",
      },
      {
        id: "copyLink",
        label: t("web.context_menu.copy_link"),
        click() {
          if (process.platform === "darwin") {
            electron.clipboard.writeBookmark(props.linkText, props.linkURL);
          } else {
            electron.clipboard.writeText(props.linkURL);
          }
        },
      },
      {
        type: "separator",
      }];
    }

    // filter out leading/trailing separators
    // TODO: https://github.com/electron/electron/issues/5869
    menuTpl = delUnusedElements(menuTpl);

    if (menuTpl.length > 0) {
      const menu = (electron.Menu || electron.remote.Menu).buildFromTemplate(menuTpl as any);

			/*
			 * When electron.remote is not available this runs in the browser process.
			 * We can safely use win in this case as it refers to the window the
			 * context-menu should open in.
			 * When this is being called from a webView, we can't use win as this
			 * would refere to the webView which is not allowed to render a popup menu.
			 */
      // electron 1.6.2 accepts an opts object - typings aren't up-to-date yet
      (menu.popup as any)((electron.remote ? electron.remote.getCurrentWindow() : wv) as any, {async: true});
    }
  });
}

function delUnusedElements(menuTpl: Electron.MenuItemOptions[]) {
  let notDeletedPrevEl: Electron.MenuItemOptions;
  return menuTpl.filter((el) => el.visible !== false).filter((el, i, arr) => {
    const toDelete = el.type === "separator" &&
      (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === "separator");
    notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
    return !toDelete;
  });
};
