import { combineReducers } from "redux";
import { RootState } from "common/types";

import system from "common/reducers/system";
import setup from "common/reducers/setup";
import profile from "common/reducers/profile";
import i18n from "common/reducers/i18n";
import ui from "common/reducers/ui";
import preferences from "common/reducers/preferences";
import tasks from "common/reducers/tasks";
import downloads from "common/reducers/downloads";
import status from "common/reducers/status";
import gameUpdates from "common/reducers/game-updates";
import commons from "common/reducers/commons";
import systemTasks from "common/reducers/system-tasks";
import broth from "common/reducers/broth";
import butlerd from "common/reducers/butlerd";
import winds from "common/reducers/winds";

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
  winds,
});
export default reducer;
