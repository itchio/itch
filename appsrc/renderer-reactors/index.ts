
import {Watcher} from "../reactors//watcher";

import shortcuts from "./shortcuts";
import encourageGenerosity from "./encourage-generosity";
import triggers from "./triggers";

let watcher = new Watcher();

shortcuts(watcher);
encourageGenerosity(watcher);
triggers(watcher);

watcher.validate();

export default watcher;
