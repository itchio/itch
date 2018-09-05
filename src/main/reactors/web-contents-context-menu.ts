import electron from "electron";

import { actions } from "common/actions";
import { Store } from "common/types";

import IntlMessageFormat from "intl-messageformat";
import env from "common/env";

const emptyObj: any = {};

export function hookWebContentsContextMenu(
  wc: Electron.WebContents,
  wind: string,
  store: Store
) {
  const intl = {
    formatMessage: ({ id }: { id: string }, values = {}): string => {
      const { i18n } = store.getState();
      const strings =
        i18n.strings[i18n.lang] ||
        i18n.strings[i18n.lang.substring(0, 2)] ||
        emptyObj;
      const msg = new IntlMessageFormat(strings[id], i18n.lang);
      return msg.format(values);
    },
  };

  wc.on("context-menu", (e, props) => {
    const editFlags = props.editFlags;
    const hasText = props.selectionText.trim().length > 0;
    const can = (type: string) =>
      ((editFlags as any)[`can${type}`] as boolean) && hasText;

    let menuTpl: Electron.MenuItemConstructorOptions[] = [
      {
        type: "separator",
      },
      {
        id: "cut",
        label: intl.formatMessage({ id: "web.context_menu.cut" }),
        // needed because of macOS limitation:
        // https://github.com/electron/electron/issues/5860
        role: can("Cut") ? "cut" : null,
        enabled: can("Cut"),
        visible: props.isEditable,
      },
      {
        id: "copy",
        label: intl.formatMessage({ id: "web.context_menu.copy" }),
        role: can("Copy") ? "copy" : null,
        enabled: can("Copy"),
        visible: props.isEditable || hasText,
      },
      {
        id: "paste",
        label: intl.formatMessage({ id: "web.context_menu.paste" }),
        role: editFlags.canPaste ? "paste" : null,
        enabled: editFlags.canPaste,
        visible: props.isEditable,
      },
      {
        type: "separator",
      },
    ];

    if (props.linkURL && props.mediaType === "none") {
      menuTpl = [];
      if (store.getState().preferences.enableTabs) {
        menuTpl = [
          ...menuTpl,
          {
            type: "separator",
          },
          {
            id: "openInNewTab",
            label: intl.formatMessage({
              id: "web.context_menu.open_in_new_tab",
            }),
            click() {
              store.dispatch(
                actions.navigate({
                  wind,
                  url: props.linkURL,
                  background: true,
                })
              );
            },
          },
        ];
      }

      menuTpl = [
        ...menuTpl,
        {
          type: "separator",
        },
        {
          id: "copyLink",
          label: intl.formatMessage({ id: "web.context_menu.copy_link" }),
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
        },
      ];
    }

    // filter out leading/trailing separators
    // TODO: https://github.com/electron/electron/issues/5869
    menuTpl = delUnusedElements(menuTpl);

    if (env.development) {
      menuTpl.push({
        id: "inspect",
        label: intl.formatMessage({ id: "web.context_menu.inspect" }),
        click() {
          store.dispatch(
            actions.inspect({
              webContentsId: wc.id,
              x: props.x,
              y: props.y,
            })
          );
        },
      });
    }

    if (menuTpl.length > 0) {
      const menu = (electron.Menu || electron.remote.Menu).buildFromTemplate(
        menuTpl as any
      );

      menu.popup({});
    }
  });
}

function delUnusedElements(menuTpl: Electron.MenuItemConstructorOptions[]) {
  let notDeletedPrevEl: Electron.MenuItemConstructorOptions;
  return menuTpl.filter(el => el.visible !== false).filter((el, i, arr) => {
    const toDelete =
      el.type === "separator" &&
      (!notDeletedPrevEl ||
        i === arr.length - 1 ||
        arr[i + 1].type === "separator");
    notDeletedPrevEl = toDelete ? notDeletedPrevEl : el;
    return !toDelete;
  });
}
