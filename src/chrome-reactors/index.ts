
import {Watcher} from "../reactors/watcher";

import fetchers from "./fetchers";
import marketProvider, {getMarkets} from "./market-provider";

let watcher = new Watcher();
marketProvider(watcher);
fetchers(watcher, getMarkets);

watcher.validate();

export default watcher;
