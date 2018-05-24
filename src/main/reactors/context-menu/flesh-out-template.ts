import urls from "common/constants/urls";
import { actions } from "common/actions";
import { IStore, IMenuTemplate, IRuntime, IMenuItem } from "common/types";

import { map } from "underscore";
import { t } from "common/format/t";

export function fleshOutTemplate(
  store: IStore,
  runtime: IRuntime,
  template: IMenuTemplate
): Electron.MenuItemConstructorOptions[] {
  const { i18n } = store.getState();

  const visitNode = (input: IMenuItem) => {
    const node = { ...input } as Electron.MenuItemConstructorOptions;
    if (node.type === "separator") {
      return node;
    }

    const { localizedLabel, role = null, enabled = true } = input;

    if (localizedLabel) {
      node.label = t(i18n, localizedLabel);
    }
    if (enabled && !node.click) {
      node.click = e => {
        const menuAction = convertMenuAction({ localizedLabel, role }, runtime);
        if (menuAction) {
          store.dispatch(menuAction);
        }
      };
    }

    if (node.submenu) {
      node.submenu = map(node.submenu as IMenuItem[], visitNode);
    }

    return node;
  };

  return map(template, visitNode);
}

function convertMenuAction(payload: IMenuItem, runtime: IRuntime) {
  const { role, localizedLabel } = payload;

  switch (role) {
    case "about":
      return actions.openInExternalBrowser({ url: urls.appHomepage });
    default: // muffin
  }

  const labelString = localizedLabel ? localizedLabel[0] : null;

  switch (labelString) {
    case "sidebar.new_tab":
      return actions.newTab({});
    case "menu.file.close_tab":
      return runtime.platform === "osx"
        ? actions.closeTabOrAuxWindow({})
        : actions.closeCurrentTab({});
    case "menu.file.close_all_tabs":
      return actions.closeAllTabs({});
    case "menu.file.close_window":
      return actions.hideWindow({});
    case "menu.file.quit":
      return actions.quitWhenMain({});
    case "menu.file.preferences":
      return actions.navigate({ url: "itch://preferences" });
    case "menu.view.downloads":
      return actions.navigate({ url: "itch://downloads" });
    case "menu.account.change_user":
      return actions.changeUser({});
    case "menu.help.view_terms":
      return actions.openInExternalBrowser({ url: urls.termsOfService });
    case "menu.help.view_license":
      return actions.openInExternalBrowser({
        url: `${urls.itchRepo}/blob/master/LICENSE`,
      });
    case "menu.help.report_issue":
      return actions.openInExternalBrowser({
        url: `${urls.itchRepo}/issues/new`,
      });
    case "menu.help.search_issue":
      return actions.openInExternalBrowser({
        url: `${urls.itchRepo}/search?type=Issues`,
      });
    case "menu.help.release_notes":
      return actions.openInExternalBrowser({
        url: `${urls.itchRepo}/releases`,
      });
    default:
      return null;
  }
}
