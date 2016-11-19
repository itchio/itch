
import {Watcher} from "../reactors//watcher";

import encourageGenerosity from "./encourage-generosity";

let watcher = new Watcher();

encourageGenerosity(watcher);

watcher.validate();

export default watcher;
