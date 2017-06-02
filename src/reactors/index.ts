
import {Watcher} from "./watcher";

import fetchers from "./fetchers";
import preboot from "./preboot";
import preferences from "./preferences";
import mainWindow from "./main-window";
import locales from "./locales";
import tray from "./tray";
import menu from "./menu";
import installLocations from "./install-locations";
import selfUpdate from "./self-update";
import setup from "./setup";
import tabs from "./tabs";
import triggers from "./triggers";
import modals from "./modals";
import openAtLogin from "./open-at-login";
import proxy from "./proxy";
import login from "./login";
import querier from "./querier";
import dialogs from "./dialogs";
import i18n from "./i18n";
import contextMenu from "./context-menu";
import rememberedSessions from "./remembered-sessions";
import session from "./session";
import navigation from "./navigation";
import commons from "./commons";
import purchases from "./purchases";
import url from "./url";

const watcher = new Watcher();

fetchers(watcher);
preboot(watcher);
preferences(watcher);
mainWindow(watcher);
locales(watcher);
tray(watcher);
menu(watcher);
installLocations(watcher);
selfUpdate(watcher);
setup(watcher);
tabs(watcher);
triggers(watcher);
modals(watcher);
openAtLogin(watcher);
proxy(watcher);
login(watcher);
querier(watcher);
dialogs(watcher);
i18n(watcher);
contextMenu(watcher);
rememberedSessions(watcher);
session(watcher);
navigation(watcher);
commons(watcher);
purchases(watcher);
url(watcher);

watcher.validate();

export default watcher;
