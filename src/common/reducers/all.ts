import { combineReducers } from "redux";
import { RootState } from "common/types";

import system from "./system";
import setup from "./setup";
import profile from "./profile";
import i18n from "./i18n";
import ui from "./ui";
import preferences from "./preferences";
import tasks from "./tasks";
import downloads from "./downloads";
import status from "./status";
import gameUpdates from "./game-updates";
import commons from "./commons";
import systemTasks from "./system-tasks";
import broth from "./broth";
import butlerd from "./butlerd";
import windows from "./windows";

const reducer = combineReducers<RootState>({
  system,
  setup,
  profile,
  i18n,
  ui,
  preferences,
  tasks,
  downloads,
  status,
  gameUpdates,
  commons,
  systemTasks,
  broth,
  butlerd,
  windows,
});
export default reducer;
