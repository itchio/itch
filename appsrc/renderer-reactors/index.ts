
import {Watcher} from "../reactors//watcher";

import notifications from "./notifications";
import shortcuts from "./shortcuts";
import encourageGenerosity from "./encourage-generosity";
import triggers from "./triggers";

let watcher = new Watcher();

notifications(watcher);
shortcuts(watcher);
encourageGenerosity(watcher);
triggers(watcher);

watcher.validate();

export default watcher;
