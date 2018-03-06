import { combineReducers } from "redux";

import modals from "./modals";
import system from "./system";
import setup from "./setup";
import rememberedProfiles from "./remembered-profiles";
import profile from "./profile";
import i18n from "./i18n";
import ui from "./ui";
import selfUpdate from "./self-update";
import preferences from "./preferences";
import tasks from "./tasks";
import downloads from "./downloads";
import status from "./status";
import gameUpdates from "./game-updates";
import commons from "./commons";
import systemTasks from "./system-tasks";

const reducer = combineReducers({
  modals,
  system,
  setup,
  rememberedProfiles,
  profile,
  i18n,
  ui,
  selfUpdate,
  preferences,
  tasks,
  downloads,
  status,
  gameUpdates,
  commons,
  systemTasks,
});
export default reducer;
