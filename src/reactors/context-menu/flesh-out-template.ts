import { t } from "../../format";
import urls from "../../constants/urls";
import * as actions from "../../actions";
import { IStore, IMenuTemplate, IRuntime, IMenuItem } from "../../types/index";

import { map } from "underscore";

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
      return actions.openUrl({ url: urls.appHomepage });
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
      return actions.navigate({ tab: "preferences" });
    case "menu.view.downloads":
      return actions.navigate({ tab: "downloads" });
    case "menu.account.change_user":
      return actions.changeUser({});
    case "menu.help.view_terms":
      return actions.openUrl({ url: urls.termsOfService });
    case "menu.help.view_license":
      return actions.openUrl({ url: `${urls.itchRepo}/blob/master/LICENSE` });
    case "menu.help.check_for_update":
      return actions.checkForSelfUpdate({});
    case "menu.help.report_issue":
      return actions.openUrl({ url: `${urls.itchRepo}/issues/new` });
    case "menu.help.search_issue":
      return actions.openUrl({ url: `${urls.itchRepo}/search?type=Issues` });
    case "menu.help.release_notes":
      return actions.openUrl({ url: `${urls.itchRepo}/releases` });
    default:
      return null;
  }
}
