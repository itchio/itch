
import {Watcher} from "./watcher";

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

let watcher = new Watcher();
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

watcher.validate();

export default watcher;
