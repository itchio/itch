
import {Watcher} from "../reactors//watcher";

import shortcuts from "./shortcuts";
import encourageGenerosity from "./encourage-generosity";

let watcher = new Watcher();

shortcuts(watcher);
encourageGenerosity(watcher);

watcher.validate();

export default watcher;
