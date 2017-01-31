
import * as electron from "electron";

import {IWebView, IMenuItem} from "../electron/types";

import * as actions from "../actions";
import {IStore} from "../types";
import {getT} from "../localizer";

interface IContextMenuOpts {
  navigate: typeof actions.navigate;
}

export default function create(win: IWebView, opts: IContextMenuOpts) {
  const wc = win.getWebContents();
  wc.on("context-menu", (e, props) => {
    const editFlags = props.editFlags;
    const hasText = props.selectionText.trim().length > 0;
    const can = (type: string) => editFlags[`can${type}`] && hasText;

    const store = require("../store").default as IStore;
    const {lang, strings} = store.getState().i18n;
    const t = getT(strings, lang);

    let menuTpl: IMenuItem[] = [{
      type: "separator",
    }, {
      id: "cut",
      label: t("web.context_menu.cut"),
      // needed because of macOS limitation:
      // https://github.com/electron/electron/issues/5860
      role: can("Cut") ? "cut" : "",
      enabled: can("Cut"),
      visible: props.isEditable,
    }, {
      id: "copy",
      label: t("web.context_menu.copy"),
      role: can("Copy") ? "copy" : "",
      enabled: can("Copy"),
      visible: props.isEditable || hasText,
    }, {
      id: "paste",
      label: t("web.context_menu.paste"),
      role: editFlags.canPaste ? "paste" : "",
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
      menu.popup((electron.remote ? electron.remote.getCurrentWindow() : win) as any);
    }
  });
}

function delUnusedElements(menuTpl: IMenuItem[]) {
  let notDeletedPrevEl: IMenuItem;
  return menuTpl.filter((el) => el.visible !== false).filter((el, i, arr) => {
    const toDelete = el.type === "separator" &&
      (!notDeletedPrevEl || i === arr.length - 1 || arr[i + 1].type === "separator");
    notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
    return !toDelete;
  });
};
