
import {Watcher} from "../reactors/watcher";

import tabFetcher from "./tab-fetcher";
import marketProvider, {getMarkets} from "./market-provider";

let watcher = new Watcher();
marketProvider(watcher);
tabFetcher(watcher, getMarkets);

watcher.validate();

export default watcher;
