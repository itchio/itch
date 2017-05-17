
import {Watcher} from "../reactors/watcher";
import marketProvider, {getMarkets} from "./market-provider";

import fetchers from "./fetchers";
import dialogs from "./dialogs";
import i18n from "./i18n";
import contextMenu from "./context-menu";
import rememberedSessions from "./remembered-sessions";
import session from "./session";
import navigation from "./navigation";
import querier from "./querier";

let watcher = new Watcher();
watcher.getMarkets = getMarkets;
marketProvider(watcher);
dialogs(watcher);
fetchers(watcher);
i18n(watcher);
contextMenu(watcher);
rememberedSessions(watcher);
session(watcher);
navigation(watcher);
querier(watcher);

watcher.validate();

export default watcher;
