import urls from "common/constants/urls";
import { actions } from "common/actions";
import { Store, MenuTemplate, Runtime, MenuItem } from "common/types";

import { map } from "underscore";
import { t } from "common/format/t";

export function fleshOutTemplate(
  wind: string,
  store: Store,
  runtime: Runtime,
  template: MenuTemplate
): Electron.MenuItemConstructorOptions[] {
  const { i18n } = store.getState();

  const visitNode = (input: MenuItem) => {
    const node = { ...input } as Electron.MenuItemConstructorOptions;
    if (node.type === "separator") {
      return node;
    }

    const { localizedLabel, role = null, enabled = true } = input;

    if (localizedLabel) {
      node.label = t(i18n, localizedLabel);
    }
    if (enabled && !node.click) {
      node.click = (e) => {
        const menuAction = convertMenuAction(
          wind,
          { localizedLabel, role },
          runtime
        );
        if (menuAction) {
          store.dispatch(menuAction);
        }
      };
    }

    if (node.submenu) {
      node.submenu = map(node.submenu as MenuItem[], visitNode);
    }

    return node;
  };

  return map(template, visitNode);
}

function convertMenuAction(wind: string, payload: MenuItem, runtime: Runtime) {
  const { role, localizedLabel } = payload;

  switch (role) {
    case "about":
      return actions.openInExternalBrowser({ url: urls.appHomepage });
    default: // muffin
  }

  const labelString = localizedLabel ? localizedLabel[0] : null;

  switch (labelString) {
    case "menu.file.show_next_tab":
      return actions.showNextTab({ wind });
    case "menu.file.show_previous_tab":
      return actions.showPreviousTab({ wind });
    case "menu.file.open_dev_tools":
      return actions.openDevTools({ wind });
    case "menu.file.focus_search":
      return actions.focusSearch({ wind });
    case "menu.file.focus_in_page_search":
      return actions.focusInPageSearch({ wind });
    case "menu.command.reload":
      return actions.commandReload({ wind });
    case "menu.command.main":
      return actions.commandMain({ wind });
    case "menu.command.location":
      return actions.commandLocation({ wind });
    case "menu.command.go_back":
      return actions.commandGoBack({ wind });
    case "menu.command.go_forward":
      return actions.commandGoForward({ wind });
    case "menu.file.focus_tab_1":
      return actions.focusNthTab({ wind, index: 1 });
    case "menu.file.focus_tab_2":
      return actions.focusNthTab({ wind, index: 2 });
    case "menu.file.focus_tab_3":
      return actions.focusNthTab({ wind, index: 3 });
    case "menu.file.focus_tab_4":
      return actions.focusNthTab({ wind, index: 4 });
    case "menu.file.focus_tab_5":
      return actions.focusNthTab({ wind, index: 5 });
    case "menu.file.focus_tab_6":
      return actions.focusNthTab({ wind, index: 6 });
    case "menu.file.focus_tab_7":
      return actions.focusNthTab({ wind, index: 7 });
    case "menu.file.focus_tab_8":
      return actions.focusNthTab({ wind, index: 8 });
    case "menu.file.focus_tab_9":
      return actions.focusNthTab({ wind, index: 9 });

    case "sidebar.new_tab":
      return actions.newTab({ wind });
    case "menu.file.close_tab":
      return runtime.platform === "osx"
        ? actions.closeTabOrAuxWindow({ wind })
        : actions.closeCurrentTab({ wind });
    case "menu.file.close_all_tabs":
      return actions.closeAllTabs({ wind });
    case "menu.file.close_window":
      return actions.hideWind({ wind });
    case "menu.file.quit":
      return actions.quitWhenMain({ wind });
    case "menu.file.preferences":
      return actions.navigate({ wind, url: "itch://preferences" });
    case "menu.view.downloads":
      return actions.navigate({ wind, url: "itch://downloads" });
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
