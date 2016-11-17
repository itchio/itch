
import {Watcher} from "../reactors//watcher";

import notifications from "./notifications";
import shortcuts from "./shortcuts";
import encourageGenerosity from "./encourage-generosity";
import triggers from "./triggers";
import loginFailed from "./login-failed";

let watcher = new Watcher();

notifications(watcher);
shortcuts(watcher);
encourageGenerosity(watcher);
triggers(watcher);
loginFailed(watcher);

watcher.validate();

export default watcher;
